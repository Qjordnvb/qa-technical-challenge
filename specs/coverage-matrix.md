# Matriz de cobertura — API de ciclo de vida de cuenta

> Trazabilidad requisito → test. Generado a partir del suite en `tests/api-suite/`.
> **Última corrida:** 29/29 tests en verde (config `playwright.api.config.ts`).

## Resumen

| Endpoint | Requisitos | Cubiertos | % |
|----------|-----------:|----------:|--:|
| API 11 — POST /createAccount | 11 | 11 | 100% |
| API 14 — GET /getUserDetailByEmail | 7 | 7 | 100% |
| API 13 — PUT /updateAccount | 7 | 7 | 100% |
| API 12 — DELETE /deleteAccount | 7 | 7 | 100% |
| Integración (cross-endpoint) | 3 | 3 | 100% |
| **Total** | **35** | **35** | **100%** ✅ |

Meta ≥ 90 % — **superada**.

## Detalle por requisito

### API 11 — POST /createAccount
| ID | Requisito | Tipo | Test | Estado |
|----|-----------|------|------|:------:|
| C11.1 | Crear con datos válidos → 201 | Happy | create-account C11.1/2 | ✅ |
| C11.2 | Contrato de respuesta (responseCode+message) | Contract | create-account C11.1/2 | ✅ |
| C11.3 | Email faltante → 400 | Validación | create-account C11.3 | ✅ |
| C11.4 | Password faltante → 400 | Validación | create-account C11.4 | ✅ |
| C11.5 | Campo de perfil faltante → 400 | Validación | create-account C11.5 | ✅ |
| C11.6 | Email duplicado (unicidad) → 400 | Seguridad | create-account C11.6 | ✅ |
| C11.7 | Email malformado sin 500 | Edge | create-account C11.7 | ✅ |
| C11.8 | SQL injection tratada como dato | Seguridad | create-account C11.8 | ✅ |
| C11.9 | XSS almacenado inerte | Seguridad | create-account C11.9 | ✅ |
| C11.10 | Campo oversize sin 500 | Escalabilidad | create-account C11.10 | ✅ |
| C11.11 | Unicode/emoji persiste | Edge/i18n | create-account C11.11 | ✅ |

### API 14 — GET /getUserDetailByEmail
| ID | Requisito | Tipo | Test | Estado |
|----|-----------|------|------|:------:|
| C14.1 | Email existente → 200 + user | Happy | get-user-detail C14.1/2 | ✅ |
| C14.2 | Contrato + **sin password** | Contract/Seguridad | get-user-detail C14.1/2 | ✅ |
| C14.3 | Email inexistente → 404 | Negativo | get-user-detail C14.3 | ✅ |
| C14.4 | Param email ausente → 400 | Validación | get-user-detail C14.4 | ✅ |
| C14.5 | Email malformado sin 500 | Edge | get-user-detail C14.5 | ✅ |
| C14.6 | SQL injection sin fuga/500 | Seguridad | get-user-detail C14.6 | ✅ |
| C14.7 | Consistencia post-update | Integración | update C13.3 + INT.1 | ✅ |

### API 13 — PUT /updateAccount
| ID | Requisito | Tipo | Test | Estado |
|----|-----------|------|------|:------:|
| C13.1 | Actualizar existente → 200 | Happy | update-account C13.1/2 | ✅ |
| C13.2 | Contrato de respuesta | Contract | update-account C13.1/2 | ✅ |
| C13.3 | La actualización persiste (GET) | Integración | update-account C13.3 | ✅ |
| C13.4 | Email ausente → 400 | Validación | update-account C13.4 | ✅ |
| C13.5 | Cuenta inexistente sin 500 | Negativo | update-account C13.5 | ✅ |
| C13.6 | Password incorrecto no actualiza | Seguridad | update-account C13.6 | ✅ |
| C13.7 | Injection/oversize sin 500 | Seguridad/Escala | update-account C13.7 | ✅ |

### API 12 — DELETE /deleteAccount
| ID | Requisito | Tipo | Test | Estado |
|----|-----------|------|------|:------:|
| C12.1 | Borrar con credenciales válidas → 200 | Happy | delete-account C12.1/2 | ✅ |
| C12.2 | Contrato de respuesta | Contract | delete-account C12.1/2 | ✅ |
| C12.3 | Tras borrar: GET 404 + login 404 | Integración | delete-account C12.3 | ✅ |
| C12.4 | Email inexistente → 404 | Negativo | delete-account C12.4 | ✅ |
| C12.5 | Password incorrecto no borra (H6) | Seguridad | delete-account C12.5 | ✅ |
| C12.6 | Doble borrado idempotente | Escalabilidad | delete-account C12.6 | ✅ |
| C12.7 | Params ausentes sin 500 | Validación | delete-account C12.7 | ✅ |

### Integración (cross-endpoint)
| ID | Escenario | Test | Estado |
|----|-----------|------|:------:|
| INT.1 | Lifecycle create→login→read→update→read→delete→verify | integration INT.1/3 | ✅ |
| INT.2 | Update no resucita cuenta borrada | integration INT.2 | ✅ |
| INT.3 | Latencia < SLA en cada hop | integration INT.1/3 | ✅ |

## Observaciones de seguridad confirmadas por el suite
- Las credenciales (`password`) **nunca** se devuelven en respuestas (C14.2).
- Unicidad de email aplicada por el backend (C11.6).
- Escritura/borrado requieren password correcto; con password erróneo → 404 y sin efecto (C12.5, C13.6).
- Los mensajes de error no distinguen "password malo" de "cuenta inexistente" → no filtran existencia de cuentas (H6).
- Inyección SQL/XSS tratada como dato inerte; sin `500` en ningún caso probado.
