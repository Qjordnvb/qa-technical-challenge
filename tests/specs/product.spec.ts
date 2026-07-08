import { test, expect } from '../fixtures/test';

const BACKPACK = 'Sauce Labs Backpack';

/**
 * Detalle de producto — información para la decisión de compra y ruta alterna de add-to-cart.
 */
test.describe('Detalle de producto', () => {
  test.beforeEach(async ({ loginAsStandard }) => {
    await loginAsStandard.expectLoaded();
  });

  test('PDP-01 [P2] el detalle muestra los datos del producto seleccionado', async ({
    inventoryPage,
    productPage,
  }) => {
    await inventoryPage.openProduct(BACKPACK);
    await expect(productPage.name).toHaveText(BACKPACK);
    await expect(productPage.description).not.toBeEmpty();
    await expect(productPage.price).toContainText('$');
    await expect(productPage.image).toBeVisible();
  });

  test('PDP-02 [P1] agregar al carrito desde el detalle actualiza el badge', async ({
    inventoryPage,
    productPage,
  }) => {
    await inventoryPage.openProduct(BACKPACK);
    await productPage.addToCart();
    await expect(productPage.cartBadge).toHaveText('1');
  });

  test('PDP-03 [P2] "Back to products" regresa al inventario', async ({
    inventoryPage,
    productPage,
    page,
  }) => {
    await inventoryPage.openProduct(BACKPACK);
    await productPage.backToProducts();
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('PDP-04 [P2][edge] un id de producto inexistente no rompe la página', async ({
    productPage,
    page,
  }) => {
    await productPage.gotoById(999);
    // No debe mostrar una pantalla de error del navegador; sigue siendo una página de la app.
    await expect(page).toHaveURL(/inventory-item\.html/);
    await expect(productPage.backButton).toBeVisible();
  });
});
