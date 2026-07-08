# Catálogo de defectos — SauceDemo

SauceDemo es un sitio **diseñado para pruebas**: inyecta bugs deterministas según el
usuario que inicia sesión. Este catálogo mapea cada defecto que el suite detecta.

**Cómo se representan en el suite:** cada defecto tiene un test que afirma el
comportamiento **correcto** y por tanto **falla en rojo** (con screenshot + video +
traza como evidencia). Todos están etiquetados `@known-defect`.

- `npm run test:regression` → excluye `@known-defect` → **debe estar 100% verde**.
- `npm run test:defects` → solo `@known-defect` → **este catálogo, todo en rojo**.

Si un defecto empieza a pasar (verde) en el carril `test:defects`, significa que
SauceDemo lo corrigió → retirar la etiqueta y moverlo a regresión.

> Nota: los defectos son deterministas por diseño, no flakiness. La distinción es
> clave — un fallo intermitente se investigaría; estos son reproducibles al 100%.

| ID | Usuario / Página | Comportamiento esperado | Comportamiento real (bug) | Prioridad | Impacto de negocio | Test |
|----|------------------|-------------------------|---------------------------|-----------|--------------------|------|
| DEF-01 | `problem_user` | Cada producto muestra su propia imagen | Todas las imágenes son la misma (`sl-404.jpg`) | P1 | Escaparate roto → el usuario no distingue productos → caída de conversión | `personas.spec.ts` › imagen distinta |
| DEF-02 | `problem_user` | El orden por precio reordena el listado | El selector no reordena nada | P2 | Descubrimiento roto → fricción de compra | `personas.spec.ts` › orden por precio |
| DEF-03 | `problem_user` | Se puede completar la compra | El checkout no acepta el apellido → no finaliza | P0 | **Embudo de compra roto → cero ingresos** | `personas.spec.ts` › compra de principio a fin |
| DEF-04 | `error_user` | El orden por precio reordena el listado | No reordena | P2 | Descubrimiento roto | `personas.spec.ts` › orden por precio |
| DEF-05 | `error_user` | Se puede completar la compra | Errores impiden finalizar | P0 | **Embudo de compra roto → cero ingresos** | `personas.spec.ts` › compra de principio a fin |
| DEF-06 | `visual_user` | El orden por precio reordena el listado | No reordena (precios en orden incorrecto) | P2 | Descubrimiento roto | `personas.spec.ts` › orden por precio |
| DEF-07 | `performance_glitch_user` | Inventario carga bajo el presupuesto (3 s) | Latencia artificial (~5 s+) | P1 | Latencia = abandono → caída de conversión y SEO | `personas.spec.ts` › presupuesto de 3s |
| DEF-08 | Inventario (todos) | El `<select>` de orden tiene nombre accesible | Sin `<label>`/`aria-label` (axe `select-name`, WCAG 4.1.2) | P1 | **Accesibilidad/ADA**: invisible para lectores de pantalla → exclusión + riesgo legal | `accessibility.spec.ts` › A11Y-02 |
| DEF-09 | Carrito (todos) | No se debe pagar con el carrito vacío | Permite avanzar al resumen de pago sin items | P2 | Pedidos inválidos / estados inconsistentes | `cart.spec.ts` › CART-05 |

## Resumen por severidad

- **P0 (bloqueantes de ingreso):** DEF-03, DEF-05 — dos personas no pueden comprar.
- **P1 (alto):** DEF-01 (escaparate), DEF-07 (rendimiento), DEF-08 (accesibilidad/legal).
- **P2 (medio):** DEF-02, DEF-04, DEF-06 (ordenamiento), DEF-09 (validación de carrito).

## Recomendación QA

De salir a producción una app con estos defectos: **bloquear release** por DEF-03/DEF-05
(sin conversión no hay negocio) y DEF-08 (exposición legal por accesibilidad). El resto
son correcciones de alta/media prioridad para el siguiente ciclo.
