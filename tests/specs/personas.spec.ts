import { test, expect } from '../fixtures/test';
import { USERS, PASSWORD, VALID_CHECKOUT } from '../fixtures/users';

/**
 * Personas / caza de bugs.
 *
 * SauceDemo inyecta defectos según el usuario. Estos tests AFIRMAN el comportamiento
 * CORRECTO. Los defectos conocidos NO se silencian en verde: se etiquetan
 * `@known-defect` y se dejan FALLAR en rojo, con screenshot + video + traza como
 * evidencia. Cada uno lleva una anotación de qué bug mapea (ver DEFECTS.md).
 *
 * Carriles (ver package.json):
 *   - `test:regression`  → excluye @known-defect  → debe estar 100% verde.
 *   - `test:defects`     → solo @known-defect      → catálogo de bugs (rojo esperado).
 *
 * Si un @known-defect empieza a pasar (verde), es señal de que SauceDemo lo corrigió
 * y toca retirar la etiqueta.
 */

const BACKPACK = 'Sauce Labs Backpack';

/**
 * Defectos conocidos por (usuario → chequeo), calibrados empíricamente contra el sitio.
 * La presencia de una entrada marca ese test como @known-defect y lo mapea en DEFECTS.md.
 */
const KNOWN_DEFECTS: Record<string, Partial<Record<'images' | 'sort' | 'journey' | 'perf', string>>> = {
  problem_user: {
    images: 'DEF-01: todas las imágenes de producto son la misma (sl-404.jpg).',
    sort: 'DEF-02: el selector de orden no reordena los productos.',
    journey: 'DEF-03: el checkout no acepta el apellido → no se puede completar la compra.',
  },
  error_user: {
    sort: 'DEF-04: el ordenamiento no reordena los productos.',
    journey: 'DEF-05: errores impiden completar la compra.',
  },
  visual_user: {
    sort: 'DEF-06: el orden por precio no reordena los productos.',
  },
  performance_glitch_user: {
    perf: 'DEF-07: latencia artificial por encima del presupuesto de 3s.',
  },
};

type Check = 'images' | 'sort' | 'journey' | 'perf';

function defect(username: string, check: Check): string | undefined {
  return KNOWN_DEFECTS[username]?.[check];
}

/** Construye las opciones del test: etiqueta + anotación cuando hay defecto conocido. */
function tagIfDefect(username: string, check: Check) {
  const description = defect(username, check);
  return description
    ? { tag: '@known-defect', annotation: { type: 'known-defect', description } }
    : {};
}

const DEFECTIVE = [USERS.problem, USERS.error, USERS.visual, USERS.performanceGlitch];

for (const persona of DEFECTIVE) {
  test.describe(`Persona: ${persona.username}`, () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
    });

    test(
      `[${persona.username}] cada producto tiene una imagen distinta`,
      tagIfDefect(persona.username, 'images'),
      async ({ loginPage, inventoryPage }) => {
        await loginPage.loginExpectingSuccess(persona.username);
        await inventoryPage.expectLoaded();

        const srcs = await inventoryPage.itemImages.evaluateAll((imgs) =>
          (imgs as HTMLImageElement[]).map((i) => i.getAttribute('src') ?? ''),
        );
        expect(new Set(srcs).size, 'todas las imágenes deben ser distintas').toBe(srcs.length);
      },
    );

    test(
      `[${persona.username}] el orden por precio (menor a mayor) funciona`,
      tagIfDefect(persona.username, 'sort'),
      async ({ loginPage, inventoryPage }) => {
        await loginPage.loginExpectingSuccess(persona.username);
        await inventoryPage.expectLoaded();

        await inventoryPage.sortBy('lohi');
        const prices = await inventoryPage.prices();
        expect(prices).toEqual([...prices].sort((a, b) => a - b));
      },
    );

    test(
      `[${persona.username}] puede completar una compra de principio a fin`,
      tagIfDefect(persona.username, 'journey'),
      async ({ loginPage, inventoryPage, cartPage, checkoutPage }) => {
        await loginPage.loginExpectingSuccess(persona.username);
        await inventoryPage.expectLoaded();
        await inventoryPage.addToCart(BACKPACK);
        await inventoryPage.openCart();
        await cartPage.checkout();
        await checkoutPage.fillInformation(
          VALID_CHECKOUT.firstName,
          VALID_CHECKOUT.lastName,
          VALID_CHECKOUT.postalCode,
        );
        await checkoutPage.continue();
        // Timeout acotado: si la persona está rota, falla rápido con evidencia
        // en vez de agotar el timeout global del test.
        await checkoutPage.finishButton.click({ timeout: 8000 });
        await expect(checkoutPage.completeHeader).toHaveText(/thank you for your order/i, {
          timeout: 8000,
        });
      },
    );
  });
}

test.describe('Persona: performance_glitch_user (rendimiento)', () => {
  test(
    'la carga del inventario respeta el presupuesto de 3s',
    tagIfDefect(USERS.performanceGlitch.username, 'perf'),
    async ({ page, loginPage, inventoryPage }) => {
      await loginPage.goto();
      await loginPage.fill(USERS.performanceGlitch.username, PASSWORD);

      const start = await page.evaluate(() => performance.now());
      await loginPage.loginButton.click();
      await page.waitForURL('**/inventory.html');
      await inventoryPage.items.first().waitFor({ state: 'visible' });
      const elapsed = (await page.evaluate(() => performance.now())) - start;

      expect(elapsed, `login→inventario tardó ${Math.round(elapsed)}ms`).toBeLessThan(3000);
    },
  );
});
