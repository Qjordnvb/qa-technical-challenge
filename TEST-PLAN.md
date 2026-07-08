# Plan de pruebas — SauceDemo (Swag Labs)

E2E con **Playwright + TypeScript** contra https://www.saucedemo.com/.
Cubre happy paths, edge cases, seguridad de sesión, comportamiento por tipo de
usuario y accesibilidad. Cada test está categorizado por **impacto de negocio,
prioridad, riesgo de no ejecutarlo** y su aporte a la **estabilidad**.

## Filosofía

1. **Priorizar el flujo que genera ingreso**: login → inventario → carrito → checkout → confirmación.
2. **Blindar límites y fallos**: entradas vacías/negativas, acceso no autenticado por URL, matemática financiera del checkout.
3. **Los bugs no se esconden, se mapean**: SauceDemo está diseñado con defectos. Los tests afirman el comportamiento *correcto* y los defectos conocidos **fallan en rojo** con evidencia (screenshot+video+traza), etiquetados `@known-defect`. Ver [DEFECTS.md](./DEFECTS.md).
4. **Accesibilidad como requisito** (WCAG 2.1 AA / ADA), no como extra.
5. **Tests independientes y deterministas**: login vía fixture, locators por rol/label/`data-test`, assertions web-first (auto-wait), sin `sleep`.

### Escala de prioridad
| Nivel | Significado |
|-------|-------------|
| **P0** | Crítico — bloquea release (ingreso, auth, seguridad, integridad financiera). |
| **P1** | Alto — funcionalidad núcleo de uso diario. |
| **P2** | Medio — importante, no bloqueante. |
| **P3** | Bajo — cosmético / nice-to-have. |

## Cómo correr

```bash
npm install && npx playwright install chromium firefox webkit
npm test              # suite completo (los @known-defect salen rojos: es lo esperado)
npm run test:regression   # solo comportamiento correcto → debe ser 100% verde
npm run test:defects      # solo @known-defect → catálogo de bugs (rojo esperado)
npm run test:a11y         # accesibilidad
npm run report            # abre el reporte HTML servido (traza/video/screenshot)
```

> **Ver el reporte:** usar `npm run report` (sirve el HTML por http). Abrir el
> `index.html` directo con `file://` rompe el visor de trazas y algunos medios.

## Arquitectura

Page Object Model + fixtures. Playwright solo ejecuta `*.spec.ts`, así que los POM/fixtures no corren como tests.

```
tests/
  pages/        login, inventory, product, cart, checkout (+ menu, header como componentes)
  fixtures/     users.ts (personas + credenciales) · test.ts (fixtures + login reusable)
  specs/        auth · session-security · inventory · product · cart · checkout
                sorting · navigation · personas · accessibility
```

Config: `baseURL` = saucedemo; proyectos chromium + firefox + webkit; `trace/video/screenshot` = `*-on-failure` (evidencia en cada fallo).

## Matriz de categorización

### Autenticación — `auth.spec.ts` (11)
| ID | Caso | Prio | Impacto / Riesgo si no se prueba |
|----|------|------|----------------------------------|
| AUTH-01 | `standard_user` entra al inventario | P0 | Puerta de entrada; sin login no hay negocio |
| AUTH-02 | `locked_out_user` rechazado | P0 | Control de acceso / compliance |
| AUTH-03/04 | Usuario/contraseña vacíos → "is required" | P1 | Guía al usuario; reduce soporte |
| AUTH-05 | Credenciales incorrectas → error genérico | P1 | Seguridad (no filtrar qué campo falló) |
| AUTH-06 | Contraseña enmascarada | P1 | Privacidad de credenciales |
| AUTH-07 | Logout limpia la sesión | P0 | Seguridad en equipos compartidos |
| AUTH-08 | Login con tecla Enter | P2 | Usabilidad / teclado (a11y) |
| AUTH-09 | Cerrar el mensaje de error | P2 | Pulcritud de UX |
| AUTH-10 | Payload script no se ejecuta ni autentica | P2 | Seguridad (defensa en profundidad) |
| AUTH-11 | Credenciales solo-espacios rechazadas | P3 | Robustez de validación |

### Seguridad de sesión — `session-security.spec.ts` (4)
| ID | Caso | Prio | Impacto / Riesgo |
|----|------|------|------------------|
| SEC-01/02/03 | URLs protegidas sin sesión redirigen al login | P0/P1 | **Fuga de control de acceso** si falla |
| SEC-04 | Tras logout, "atrás" no restaura la sesión | P1 | Sesión residual en caché |

### Inventario — `inventory.spec.ts` (7)
| ID | Caso | Prio | Impacto / Riesgo |
|----|------|------|------------------|
| INV-01 | 6 productos con datos completos | P1 | Catálogo = escaparate |
| INV-02 | Add → badge +1 y botón "Remove" | P0 | **Inicio del embudo de compra** |
| INV-03 | Remove → badge -1 | P1 | Estado consistente |
| INV-04 | Add múltiple → conteo correcto | P1 | Integridad del carrito |
| INV-05 | Badge persiste al navegar | P1 | Confianza en el carrito |
| INV-06 | Precios con formato `$0.00` | P2 | Integridad de datos |
| INV-07 | Click en producto → detalle | P2 | Descubrimiento |

### Detalle — `product.spec.ts` (4)
| ID | Caso | Prio | Impacto / Riesgo |
|----|------|------|------------------|
| PDP-01 | Datos correctos del producto | P2 | Decisión de compra informada |
| PDP-02 | Add desde detalle → badge | P1 | Ruta alterna de compra |
| PDP-03 | "Back to products" | P2 | Navegación |
| PDP-04 | `id` inválido en URL no rompe la página | P2 | Robustez ante URLs manipuladas |

### Ordenamiento — `sorting.spec.ts` (5)
| ID | Caso | Prio | Impacto / Riesgo |
|----|------|------|------------------|
| SORT-01..04 | Nombre A→Z/Z→A y Precio ↑/↓ ordenan de verdad | P2 | Descubrimiento; orden roto frustra |
| SORT-05 | La selección de orden persiste | P3 | Pulcritud UX |

### Carrito — `cart.spec.ts` (6)
| ID | Caso | Prio | Impacto / Riesgo |
|----|------|------|------------------|
| CART-01 | Items con nombre/precio/qty correctos | P0 | El carrito es la promesa de compra |
| CART-02 | Remove actualiza lista y badge | P1 | Control del usuario |
| CART-03 | "Continue Shopping" | P2 | Navegación del embudo |
| CART-04 | "Checkout" avanza a step-one | P0 | Transición al pago |
| CART-05 | No pagar con carrito vacío | P2 | ⚠️ `@known-defect` DEF-09 |
| CART-06 | El carrito persiste | P1 | Retención de intención de compra |

### Checkout — `checkout.spec.ts` (9) · núcleo P0
| ID | Caso | Prio | Impacto / Riesgo |
|----|------|------|------------------|
| CHK-01 | Flujo completo → confirmación | P0 | **La conversión** |
| CHK-02/03/04 | Campos requeridos → error específico | P1 | Datos de envío válidos |
| CHK-05/07 | Subtotal = suma; Total = subtotal + impuesto | P0 | **Integridad financiera** |
| CHK-06 | Impuesto = 8% del subtotal | P1 | Cumplimiento fiscal |
| CHK-08 | Cancelar regresa al carrito | P2 | Salida del embudo |
| CHK-09 | "Back Home" resetea el carrito | P1 | Estado limpio para la siguiente compra |
| CHK-10 | Inputs extremos sin romper | P2 | Robustez del formulario |

### Navegación — `navigation.spec.ts` (4)
| ID | Caso | Prio | Impacto / Riesgo |
|----|------|------|------------------|
| NAV-01 | Menú lista 4 opciones | P2 | Acceso a funciones globales |
| NAV-02 | "Reset App State" limpia el carrito | P2 | Recuperación de estado |
| NAV-03 | "All Items" navega al inventario | P3 | Navegación |
| NAV-04 | Links del footer correctos | P3 | Marca / SEO |

### Personas — `personas.spec.ts` (13) · caza de bugs
Recorre `problem_user`, `error_user`, `visual_user`, `performance_glitch_user`
afirmando comportamiento correcto (imágenes, orden, compra completa, rendimiento).
Los defectos detectados están en [DEFECTS.md](./DEFECTS.md) (DEF-01..07).

### Accesibilidad — `accessibility.spec.ts` (7) · transversal P1
| ID | Caso | Herramienta | Impacto / Riesgo |
|----|------|-------------|------------------|
| A11Y-01/03/04 | axe (WCAG 2.1 AA) en login, carrito, checkout: 0 violaciones critical/serious | axe-core | **Cumplimiento legal (ADA)** + alcance + SEO |
| A11Y-02 | axe en inventario | axe-core | ⚠️ `@known-defect` DEF-08 (`select-name`) |
| A11Y-05 | Campos de login con nombre accesible | manual | Lectores de pantalla |
| A11Y-06 | Login operable solo con teclado | manual | Usuarios sin ratón |
| A11Y-07 | Imágenes de producto con `alt` | manual | Lectores de pantalla |

## Estado actual (chromium)

- **Regresión:** 61 / 61 verde — sin falsos positivos.
- **Defectos mapeados:** 9 / 9 en rojo con evidencia (ver [DEFECTS.md](./DEFECTS.md)).

## Fuera de alcance
- Pruebas de carga/estrés reales (solo un presupuesto de latencia puntual).
- Visual regression pixel-perfect (se valida por atributos/posición, no por baseline de píxeles).
- Pipeline CI (la config ya contempla `CI` para `retries`/`forbidOnly`).
