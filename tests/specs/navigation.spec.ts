import { test, expect } from '../fixtures/test';

const BACKPACK = 'Sauce Labs Backpack';

/**
 * Navegación y menú — funciones globales: menú lateral, reset de estado y footer.
 */
test.describe('Navegación y menú', () => {
  test.beforeEach(async ({ loginAsStandard }) => {
    await loginAsStandard.expectLoaded();
  });

  test('NAV-01 [P2] el menú lateral abre y lista las 4 opciones', async ({ inventoryPage }) => {
    await inventoryPage.menu.open();
    await expect(inventoryPage.menu.allItems).toBeVisible();
    await expect(inventoryPage.menu.about).toBeVisible();
    await expect(inventoryPage.menu.logout).toBeVisible();
    await expect(inventoryPage.menu.resetAppState).toBeVisible();
  });

  test('NAV-02 [P2] "Reset App State" limpia el carrito', async ({ inventoryPage }) => {
    await inventoryPage.addToCart(BACKPACK);
    await expect(inventoryPage.cartBadge).toHaveText('1');
    await inventoryPage.menu.doResetAppState();
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });

  test('NAV-03 [P3] "All Items" navega al inventario desde el detalle', async ({
    inventoryPage,
    productPage,
    page,
  }) => {
    await inventoryPage.openProduct(BACKPACK);
    await expect(page).toHaveURL(/inventory-item\.html/);
    await productPage.page.locator('#inventory_sidebar_link').waitFor({ state: 'hidden' });
    await inventoryPage.menu.open();
    await inventoryPage.menu.allItems.click();
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('NAV-04 [P3] los links sociales del footer apuntan a las redes correctas', async ({
    page,
  }) => {
    const twitter = page.locator('[data-test="social-twitter"] a, .social_twitter a');
    const facebook = page.locator('[data-test="social-facebook"] a, .social_facebook a');
    const linkedin = page.locator('[data-test="social-linkedin"] a, .social_linkedin a');

    await expect(twitter).toHaveAttribute('href', /(twitter|x)\.com/);
    await expect(facebook).toHaveAttribute('href', /facebook\.com/);
    await expect(linkedin).toHaveAttribute('href', /linkedin\.com/);
  });
});
