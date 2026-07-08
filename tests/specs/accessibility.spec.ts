import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/test';
import { USERS, PASSWORD } from '../fixtures/users';

/**
 * Accesibilidad — requisito legal (WCAG 2.1 AA / ADA), alcance de usuarios y SEO.
 *
 * Combinamos escaneo automático (axe-core) con checks manuales de teclado, labels
 * y foco que axe no cubre bien. Los escaneos reportan solo violaciones
 * critical/serious para mantener la señal accionable; las violaciones se listan
 * en el mensaje del assert como evidencia, no se ocultan.
 */

function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
}

function seriousViolations(results: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  return results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
}

test.describe('Accesibilidad (axe-core, WCAG 2.1 AA)', () => {
  test('A11Y-01 [P1] página de login sin violaciones critical/serious', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    const results = await scan(page).analyze();
    expect(seriousViolations(results), JSON.stringify(seriousViolations(results), null, 2)).toEqual(
      [],
    );
  });

  test('A11Y-02 [P1] inventario sin violaciones critical/serious', {
    tag: '@known-defect',
    annotation: {
      type: 'known-defect',
      description:
        'DEF-08: el <select> de ordenamiento no tiene nombre accesible (axe: select-name, WCAG 4.1.2, critical).',
    },
  }, async ({ page, loginAsStandard }) => {
    await loginAsStandard.expectLoaded();
    const results = await scan(page).analyze();
    expect(seriousViolations(results), JSON.stringify(seriousViolations(results), null, 2)).toEqual(
      [],
    );
  });

  test('A11Y-03 [P1] carrito sin violaciones critical/serious', async ({
    page,
    loginAsStandard,
    cartPage,
  }) => {
    await loginAsStandard.addToCart('Sauce Labs Backpack');
    await cartPage.goto();
    await cartPage.expectLoaded();
    const results = await scan(page).analyze();
    expect(seriousViolations(results), JSON.stringify(seriousViolations(results), null, 2)).toEqual(
      [],
    );
  });

  test('A11Y-04 [P1] checkout (información) sin violaciones critical/serious', async ({
    page,
    loginAsStandard,
    cartPage,
  }) => {
    await loginAsStandard.addToCart('Sauce Labs Backpack');
    await cartPage.goto();
    await cartPage.checkout();
    const results = await scan(page).analyze();
    expect(seriousViolations(results), JSON.stringify(seriousViolations(results), null, 2)).toEqual(
      [],
    );
  });
});

test.describe('Accesibilidad (checks manuales)', () => {
  test('A11Y-05 [P1] los campos de login tienen nombre accesible', async ({ page, loginPage }) => {
    await loginPage.goto();
    // getByPlaceholder resuelve por texto accesible; reforzamos con roles.
    await expect(page.getByRole('textbox', { name: /username/i })).toBeVisible();
    await expect(loginPage.password).toHaveAttribute('placeholder', /password/i);
  });

  test('A11Y-06 [P1][teclado] el flujo de login es operable solo con teclado', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.username.focus();
    await page.keyboard.type(USERS.standard.username);
    await page.keyboard.press('Tab');
    await page.keyboard.type(PASSWORD);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('A11Y-07 [P1] las imágenes de producto tienen texto alternativo', async ({
    loginAsStandard,
    inventoryPage,
  }) => {
    await loginAsStandard.expectLoaded();
    const count = await inventoryPage.itemImages.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(inventoryPage.itemImages.nth(i)).toHaveAttribute('alt', /.+/);
    }
  });
});
