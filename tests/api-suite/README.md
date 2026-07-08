# API Suite — Contract & Integration Testing

Suite de *contract testing* + *pruebas de integración* para el ciclo CRUD de cuenta de
`automationexercise.com`. **Aislado** del suite de UI (config, carpetas y scripts propios).

## Endpoints cubiertos
| API | Método | Ruta |
|-----|--------|------|
| 11 | POST | `/api/createAccount` |
| 14 | GET | `/api/getUserDetailByEmail` |
| 13 | PUT | `/api/updateAccount` |
| 12 | DELETE | `/api/deleteAccount` |
| 7 (apoyo) | POST | `/api/verifyLogin` |

## Cómo correr
```bash
npm run test:api-suite                 # todo el suite (config aislado, sin navegador)
npm run report:api                     # abrir el reporte HTML (playwright-report-api/)

# variantes
npx playwright test --config=playwright.api.config.ts -g "createAccount"   # por endpoint
API_BASE_URL=https://staging.example.com npm run test:api-suite            # apuntar a otro entorno
```

## Estructura
```
playwright.api.config.ts     # config aislado (testDir=tests/api-suite, sin browser)
src/api/client.ts            # ApiClient tipado (form-encoded; parsea responseCode del body)
src/api/schemas.ts           # validadores de contrato (envelope, user detail, SLA, no-password)
src/api/data.ts              # factory de datos (válidos, faltantes, maliciosos, oversize)
tests/api-suite/
  fixtures.ts                # fixture `api` + `provisionedUser` (auto-crea y auto-borra)
  *.spec.ts                  # un spec por endpoint + integración del lifecycle
```

## Notas de contrato
- **La API responde HTTP 200 siempre**; el código real está en `body.responseCode`. Las
  aserciones se hacen sobre el body (ver `src/api/client.ts`).
- Requests en `application/x-www-form-urlencoded` (no JSON).
- Cada test provisiona y limpia su propio usuario (emails únicos) → paralelizable y sin
  ensuciar el sandbox público.

Plan completo: [`specs/account-lifecycle-api.plan.md`](../../specs/account-lifecycle-api.plan.md) ·
Cobertura: [`specs/coverage-matrix.md`](../../specs/coverage-matrix.md)
