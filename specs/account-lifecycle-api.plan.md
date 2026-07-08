# Plan de Pruebas — Contract & Integration Testing
## API de ciclo de vida de cuenta — automationexercise.com

> **Objetivo:** Suite de *contract testing* + *pruebas de integración* sobre 4 endpoints que
> forman el ciclo CRUD de una cuenta de usuario, garantizando cobertura de requisitos ≥ 90 %
> y validando que el backend sea **seguro** (validación de entrada, no fuga de datos, unicidad)
> y **escalable** (idempotencia, tiempos de respuesta, comportamiento bajo entradas extremas).

- **Base URL:** `https://automationexercise.com/api`
- **Stack:** Playwright Test + TypeScript (fixture `request`, sin navegador).
- **Fecha:** 2026-07-08

---

## 1. Hallazgos de contrato (reconocimiento en vivo)

Antes de diseñar los casos se sondeó la API real con `curl`. Hallazgos que **condicionan todo el diseño**:

| # | Hallazgo | Impacto en las pruebas |
|---|----------|------------------------|
| H1 | **Todas** las respuestas devuelven `HTTP 200`, incluso errores. El código real viaja en el campo JSON `responseCode`. | Las aserciones de contrato se hacen sobre **`body.responseCode`**, no sobre `res.status()`. Se documenta como *quirk* del contrato. |
| H2 | El cuerpo de request es `application/x-www-form-urlencoded` (form fields), no JSON. | El cliente envía `form`, no `data` JSON. |
| H3 | `createAccount` valida **presencia de campos en orden** antes que reglas de negocio (p.ej. reporta `firstname parameter is missing` antes de detectar email duplicado). | Casos de campo-faltante deben probarse campo por campo; el de unicidad requiere payload completo. |
| H4 | Email duplicado con payload completo → `400 "Email already exists!"` (constraint de unicidad activo). | Caso de seguridad/integridad de datos. |
| H5 | `getUserDetailByEmail` **no** devuelve el campo `password`. | Aserción de seguridad: el hash/clave nunca se expone. |
| H6 | `deleteAccount` con email correcto + password incorrecto → `404 "Account not found!"` (no borra, y no distingue "password malo" de "no existe"). | Caso de seguridad: no permite borrado sin credenciales válidas y no filtra existencia de la cuenta vía mensajes de error. |
| H7 | Respuestas de error usan mensajes en texto libre en `message`. | El contrato afirma `responseCode` + patrón de `message`. |

### Contrato observado por endpoint

| API | Método | Ruta | Campos requeridos (observados) | Éxito | Mensaje |
|-----|--------|------|-------------------------------|-------|---------|
| 11 | POST | `/createAccount` | name, email, password, title, birth_date/month/year, firstname, lastname, company, address1, country, zipcode, state, city, mobile_number | `201` | `User created!` |
| 14 | GET | `/getUserDetailByEmail?email=` | email (query) | `200` | objeto `user` (sin password) |
| 13 | PUT | `/updateAccount` | mismos que createAccount (email identifica) | `200` | `User updated!` |
| 12 | DELETE | `/deleteAccount` | email, password | `200` | `Account deleted!` |

Endpoint de apoyo (no es objetivo pero se usa para verificar integración): **API 7** `POST /verifyLogin` → `200 "User exists!"`.

---

## 2. Endpoints seleccionados y justificación

Se eligió el **ciclo CRUD de cuenta** en lugar de endpoints sueltos (productos/marcas) porque:

1. **Cubre los 4 verbos** exigidos: POST (create), GET (read), PUT (update), DELETE (delete).
2. **Permite integración real encadenada:** el estado creado por uno alimenta al siguiente
   (crear → leer → actualizar → re-leer → borrar → verificar borrado). Endpoints de solo lectura
   no permiten probar consistencia de estado.
3. **Es autolimpiante y hermético:** cada corrida provisiona su propio usuario con email único
   (`qa_<timestamp>_<rand>@…`) y lo elimina en teardown. No depende de credenciales ajenas ni
   ensucia el sandbox público compartido.
4. **Concentra el riesgo de negocio:** las cuentas son el activo donde importan seguridad
   (validación, unicidad, no-fuga de credenciales) y escalabilidad.

---

## 3. Estrategia de datos de prueba

- **Auto-provisión:** un *fixture* crea un usuario nuevo (email único por timestamp+random) en
  `beforeAll`/setup y lo borra en `afterAll`/teardown, incluso si el test falla.
- **Aislamiento:** cada spec que muta estado crea su propio usuario → los tests son
  independientes y ejecutables en cualquier orden y en paralelo (`fullyParallel`).
- **Factory de datos:** `src/api/data.ts` genera payloads válidos y variantes (campos faltantes,
  tipos inválidos, cargas maliciosas) de forma declarativa.
- **Sin secretos en el repo:** no se commitean credenciales; todo es generado o vía `BASE_URL` env.

---

## 4. Matriz de trazabilidad requisito → caso (cobertura)

Cobertura = (requisitos con al menos un caso) / (requisitos totales). Meta ≥ 90 %.

### API 11 — POST /createAccount
| ID | Requisito / clase | Tipo | Caso |
|----|-------------------|------|------|
| C11.1 | Crear cuenta con datos válidos → 201 | Happy | payload completo válido |
| C11.2 | Esquema/contrato de respuesta (responseCode+message) | Contract | valida forma del body |
| C11.3 | Email faltante → 400 | Validación | omitir email |
| C11.4 | Password faltante → 400 | Validación | omitir password |
| C11.5 | Campo de perfil faltante (firstname) → 400 | Validación | omitir firstname |
| C11.6 | Email duplicado (unicidad) → 400 "Email already exists!" | Seguridad/Integridad | crear 2 veces |
| C11.7 | Email con formato inválido | Edge | `email=notanemail` |
| C11.8 | Inyección SQL en campos → sin 500 / sin efecto | Seguridad | `' OR 1=1 --` en name/email |
| C11.9 | XSS almacenado en `name` → se guarda escapado, se refleja seguro | Seguridad | `<script>` en name |
| C11.10 | Campo extremadamente largo (p.ej. name 10k chars) → sin 500 | Escalabilidad | fuzz de longitud |
| C11.11 | Unicode/emoji en campos → 201 y persiste correcto | Edge | `名前 🎉` |

### API 14 — GET /getUserDetailByEmail
| ID | Requisito / clase | Tipo | Caso |
|----|-------------------|------|------|
| C14.1 | Email existente → 200 + objeto user | Happy | usuario provisionado |
| C14.2 | Contrato: user tiene campos esperados y **NO** password | Contract/Seguridad | valida esquema + ausencia de password |
| C14.3 | Email inexistente → 404 "Account not found…" | Negativo | email aleatorio |
| C14.4 | Param email ausente → 400 | Validación | sin query |
| C14.5 | Email malformado → 400/404 (no 500) | Edge | `email=@@@` |
| C14.6 | Inyección SQL en email → no fuga / no 500 | Seguridad | `a@b.com' OR '1'='1` |
| C14.7 | Consistencia post-update: refleja datos actualizados | Integración | ver §5 |

### API 13 — PUT /updateAccount
| ID | Requisito / clase | Tipo | Caso |
|----|-------------------|------|------|
| C13.1 | Actualizar cuenta existente → 200 "User updated!" | Happy | cambiar varios campos |
| C13.2 | Contrato de respuesta | Contract | forma del body |
| C13.3 | La actualización **persiste** (verificado vía GET) | Integración | update→get |
| C13.4 | Email ausente → 400 | Validación | sin email |
| C13.5 | Actualizar cuenta inexistente → error controlado (no 500) | Negativo | email random |
| C13.6 | Password incorrecto no permite actualizar datos ajenos | Seguridad | email válido + pass malo |
| C13.7 | Inyección/oversize en campos de update → sin 500 | Seguridad/Escala | payload malicioso |

### API 12 — DELETE /deleteAccount
| ID | Requisito / clase | Tipo | Caso |
|----|-------------------|------|------|
| C12.1 | Borrar con credenciales válidas → 200 "Account deleted!" | Happy | usuario provisionado |
| C12.2 | Contrato de respuesta | Contract | forma del body |
| C12.3 | Tras borrar, la cuenta ya no existe (GET→404, login→404) | Integración | delete→get/login |
| C12.4 | Email inexistente → 404 | Negativo | email random |
| C12.5 | Password incorrecto (email válido) → 404, **no** borra | Seguridad | ver H6 |
| C12.6 | Doble borrado (idempotencia) → 2º intento 404, sin 500 | Escalabilidad | delete x2 |
| C12.7 | Campos ausentes → 400/404 controlado | Validación | sin password |

### Integración de ciclo completo (cross-endpoint)
| ID | Escenario |
|----|-----------|
| INT.1 | **Lifecycle feliz:** create → verifyLogin(200) → getDetail(coincide) → update → getDetail(refleja cambios) → delete → getDetail(404) & verifyLogin(404). |
| INT.2 | **No-resurrección:** tras delete, update sobre ese email no revive la cuenta. |
| INT.3 | **Rendimiento/escalabilidad:** cada llamada del lifecycle responde < umbral (p.ej. 3 s) — smoke de latencia. |

**Conteo:** 35 requisitos catalogados; el suite implementa **35/35 → cobertura 100 %** (29 tests).
Ver reporte con estado por ID en [`specs/coverage-matrix.md`](./coverage-matrix.md).

---

## 5. Casos de integración (detalle INT.1)

```
1. POST /createAccount (payload válido, email único)      → 201 User created!
2. POST /verifyLogin   (email,password)                    → 200 User exists!
3. GET  /getUserDetailByEmail?email=…                      → 200, user == datos creados
4. PUT  /updateAccount (mismos campos, valores cambiados)  → 200 User updated!
5. GET  /getUserDetailByEmail?email=…                      → 200, user refleja cambios (paso 4)
6. DELETE /deleteAccount (email,password)                  → 200 Account deleted!
7. GET  /getUserDetailByEmail?email=…                      → 404 Account not found
8. POST /verifyLogin   (email,password)                    → 404 User not found
```
Verifica **consistencia de estado end-to-end**, no solo respuestas aisladas.

---

## 6. Edge cases para un backend seguro y escalable

| Categoría | Qué probamos | Por qué |
|-----------|--------------|---------|
| **Inyección SQL** | `' OR 1=1 --`, `'; DROP TABLE…` en email/name | El backend no debe ejecutar ni caer (500); debe tratar como dato. |
| **XSS almacenado** | `<script>alert(1)</script>` en `name` | Debe almacenarse/escaparse sin ejecutarse; contrato no se rompe. |
| **Fuga de datos** | password nunca en respuestas; errores no revelan existencia de cuenta (H5, H6) | Principio de mínima exposición. |
| **Unicidad** | email duplicado (H4) | Integridad de datos, evita cuentas duplicadas. |
| **Límites/oversize** | campos de 10k+ chars, mobile con letras | Robustez ante entradas grandes/mal tipadas (DoS por payload). |
| **Unicode/i18n** | nombres con emoji/CJK | Escalabilidad internacional; encoding correcto. |
| **Idempotencia** | doble DELETE, update de cuenta borrada | Comportamiento predecible bajo reintentos (clave en sistemas distribuidos). |
| **Latencia** | tiempo de respuesta por request < umbral | Smoke de escalabilidad/SLA. |
| **Método/param faltante** | validación de contrato por campo | Fail-fast y mensajes claros. |

---

## 7. Arquitectura del suite

> **Aislamiento (trabajo en paralelo con el agente de UI):** el repo es compartido. El agente de
> UI usa `playwright.config.ts` (saucedemo, 3 navegadores) y `tests/specs/`. Nuestro suite de API
> vive en carpetas propias y **no toca** ni el config ni los specs de UI:
> - config propio: **`playwright.api.config.ts`** (`testDir: tests/api-suite`, sin navegador).
> - reporte/resultados propios: `playwright-report-api/`, `test-results-api/`.
> - script propio: **`npm run test:api-suite`** (aditivo; no altera `test`, `test:ui`, etc.).

```
specs/
  account-lifecycle-api.plan.md      ← este documento
  coverage-matrix.md                 ← reporte de cobertura (generado tras correr)
playwright.api.config.ts             ← config aislado del suite de API
src/api/
  client.ts     ← ApiClient tipado (wrappea request; envía form; parsea body)
  schemas.ts    ← validadores de contrato (responseCode/message/user) + type guards
  data.ts       ← factory de payloads válidos y variantes (faltantes, maliciosos, oversize)
tests/api-suite/
  fixtures.ts                        ← fixture `api` (cliente) + `provisionedUser` (auto-crear/borrar)
  create-account.spec.ts
  get-user-detail.spec.ts
  update-account.spec.ts
  delete-account.spec.ts
  account-lifecycle.integration.spec.ts
```

- **Contract testing:** `schemas.ts` valida forma exacta de cada respuesta (campos presentes,
  tipos, `responseCode`, ausencia de `password`). Un cambio de contrato del backend rompe el test.
- **Integración:** el spec de lifecycle encadena endpoints reales verificando consistencia.
- **Independencia:** cada spec provisiona/limpia su propio estado (`fullyParallel: true`).

---

## 8. Criterios de aceptación

1. Suite verde de forma estable (reintentos con el *test-healer* si hay flakiness de red).
2. `specs/coverage-matrix.md` muestra ≥ 90 % de requisitos cubiertos con estado por ID.
3. Todos los casos de seguridad (inyección, XSS, fuga, unicidad) presentes y pasando.
4. Cero credenciales hardcodeadas; el sandbox queda limpio tras la corrida.

---

## 9. Riesgos y supuestos

- **Sandbox público compartido:** otros usuarios pueden crear ruido; mitigado con emails únicos.
- **Rate limiting / caídas del sitio:** reintentos en CI (`retries: 2`) + healer.
- **El *quirk* HTTP-200 (H1)** podría cambiar; el contrato lo documenta explícitamente para que,
  si el backend empezara a devolver códigos HTTP reales, el test lo detecte como cambio de contrato.
- **"Coverage 90 %"** se interpreta como cobertura de **requisitos** (no de código del backend de
  terceros), consensuado con el solicitante.
