import { test, expect } from '../fixtures/test';

const BACKPACK = 'Sauce Labs Backpack';
const BIKE_LIGHT = 'Sauce Labs Bike Light';

/**
 * Inventario — el escaparate y el inicio del embudo de compra.
 */
test.describe('Inventario', () => {
  test.beforeEach(async ({ loginAsStandard }) => {
    await loginAsStandard.expectLoaded();
  });

  test('INV-01 [P1] muestra 6 productos, cada uno con datos completos', async ({
    inventoryPage,
  }) => {
    await expect(inventoryPage.items).toHaveCount(6);
    const count = await inventoryPage.items.count();
    for (let i = 0; i < count; i++) {
      const item = inventoryPage.items.nth(i);
      await expect(item.locator('.inventory_item_name')).toBeVisible();
      await expect(item.locator('.inventory_item_desc')).toBeVisible();
      await expect(item.locator('.inventory_item_price')).toBeVisible();
      await expect(item.locator('img.inventory_item_img')).toBeVisible();
      await expect(item.getByRole('button', { name: /add to cart/i })).toBeVisible();
    }
  });

  test('INV-02 [P0] agregar al carrito incrementa el badge y cambia el botón a Remove', async ({
    inventoryPage,
  }) => {
    await inventoryPage.addToCart(BACKPACK);
    await expect(inventoryPage.cartBadge).toHaveText('1');
    await expect(inventoryPage.removeButton(BACKPACK)).toBeVisible();
    await expect(inventoryPage.addButton(BACKPACK)).toHaveCount(0);
  });

  test('INV-03 [P1] quitar del carrito decrementa el badge y restaura el botón Add', async ({
    inventoryPage,
  }) => {
    await inventoryPage.addToCart(BACKPACK);
    await expect(inventoryPage.cartBadge).toHaveText('1');
    await inventoryPage.removeFromCart(BACKPACK);
    await expect(inventoryPage.cartBadge).toHaveCount(0);
    await expect(inventoryPage.addButton(BACKPACK)).toBeVisible();
  });

  test('INV-04 [P1] agregar varios productos refleja el conteo correcto', async ({
    inventoryPage,
  }) => {
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.addToCart(BIKE_LIGHT);
    await expect(inventoryPage.cartBadge).toHaveText('2');
  });

  test('INV-05 [P1] el badge del carrito persiste al navegar al detalle y volver', async ({
    inventoryPage,
    productPage,
  }) => {
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.openProduct(BACKPACK);
    await expect(productPage.cartBadge).toHaveText('1');
    await productPage.backToProducts();
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('INV-06 [P2] los precios usan formato $ con dos decimales', async ({ inventoryPage }) => {
    const raw = await inventoryPage.itemPrices.allTextContents();
    for (const price of raw) {
      expect(price).toMatch(/^\$\d+\.\d{2}$/);
    }
  });

  test('INV-07 [P2] al hacer click en un producto se abre su detalle', async ({
    inventoryPage,
    productPage,
    page,
  }) => {
    await inventoryPage.openProduct(BACKPACK);
    await expect(page).toHaveURL(/inventory-item\.html/);
    await expect(productPage.name).toHaveText(BACKPACK);
  });
});
