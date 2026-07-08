import { test, expect } from '../fixtures/test';

const BACKPACK = 'Sauce Labs Backpack';
const BIKE_LIGHT = 'Sauce Labs Bike Light';

/**
 * Carrito — la promesa de compra. Debe reflejar exactamente lo que el usuario eligió.
 */
test.describe('Carrito', () => {
  test.beforeEach(async ({ loginAsStandard }) => {
    await loginAsStandard.expectLoaded();
  });

  test('CART-01 [P0] los productos agregados aparecen con nombre, precio y cantidad', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.addToCart(BIKE_LIGHT);
    await inventoryPage.openCart();
    await cartPage.expectLoaded();

    await expect(cartPage.items).toHaveCount(2);
    await expect(cartPage.names()).resolves.toEqual(
      expect.arrayContaining([BACKPACK, BIKE_LIGHT]),
    );
    for (const qty of await cartPage.quantities.allTextContents()) {
      expect(qty).toBe('1');
    }
    for (const price of await cartPage.itemPrices.allTextContents()) {
      expect(price).toMatch(/^\$\d+\.\d{2}$/);
    }
  });

  test('CART-02 [P1] quitar un item desde el carrito actualiza lista y badge', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.addToCart(BIKE_LIGHT);
    await inventoryPage.openCart();
    await cartPage.remove(BACKPACK);

    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.cartBadge).toHaveText('1');
  });

  test('CART-03 [P2] "Continue Shopping" regresa al inventario', async ({
    inventoryPage,
    cartPage,
    page,
  }) => {
    await inventoryPage.openCart();
    await cartPage.continue();
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('CART-04 [P0] "Checkout" avanza al paso de información', async ({
    inventoryPage,
    cartPage,
    page,
  }) => {
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.openCart();
    await cartPage.checkout();
    await expect(page).toHaveURL(/checkout-step-one\.html/);
  });

  test('CART-05 [P2][edge] no se debe poder pagar con el carrito vacío', {
    tag: '@known-defect',
    annotation: {
      type: 'known-defect',
      description:
        'DEF-09: SauceDemo permite avanzar al resumen de pago con el carrito vacío; debería bloquearse.',
    },
  }, async ({ inventoryPage, cartPage, checkoutPage, page }) => {
    // Comportamiento CORRECTO esperado: con el carrito vacío no debe llegarse al
    // resumen de pago (checkout-step-two). SauceDemo sí lo permite → falla y mapea el bug.
    await inventoryPage.openCart();
    await expect(cartPage.items).toHaveCount(0);
    await cartPage.checkout();
    await checkoutPage.fillInformation('Ada', 'Lovelace', '28001');
    await checkoutPage.continue();
    await expect(page, 'no debería alcanzar el resumen de pago sin items').not.toHaveURL(
      /checkout-step-two\.html/,
    );
  });

  test('CART-06 [P1] el carrito persiste al salir del carrito y volver', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.openCart();
    await cartPage.continue();
    await inventoryPage.openCart();
    await expect(cartPage.items).toHaveCount(1);
  });
});
