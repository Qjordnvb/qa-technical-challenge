import { test, expect } from '../fixtures/test';
import { VALID_CHECKOUT } from '../fixtures/users';

const BACKPACK = 'Sauce Labs Backpack';
const BIKE_LIGHT = 'Sauce Labs Bike Light';

/**
 * Checkout — la conversión y la integridad financiera. Núcleo P0.
 */
test.describe('Checkout', () => {
  test.beforeEach(async ({ loginAsStandard, inventoryPage, cartPage }) => {
    await loginAsStandard.expectLoaded();
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.addToCart(BIKE_LIGHT);
    await inventoryPage.openCart();
    await cartPage.checkout();
  });

  test('CHK-01 [P0] flujo completo termina en confirmación de pedido', async ({
    checkoutPage,
  }) => {
    await checkoutPage.fillInformation(
      VALID_CHECKOUT.firstName,
      VALID_CHECKOUT.lastName,
      VALID_CHECKOUT.postalCode,
    );
    await checkoutPage.continue();
    await checkoutPage.finish();
    await checkoutPage.expectOrderComplete();
  });

  test('CHK-02 [P1] falta el nombre → error específico', async ({ checkoutPage }) => {
    await checkoutPage.fillInformation('', VALID_CHECKOUT.lastName, VALID_CHECKOUT.postalCode);
    await checkoutPage.continue();
    await expect(checkoutPage.error).toContainText(/First Name is required/i);
  });

  test('CHK-03 [P1] falta el apellido → error específico', async ({ checkoutPage }) => {
    await checkoutPage.fillInformation(VALID_CHECKOUT.firstName, '', VALID_CHECKOUT.postalCode);
    await checkoutPage.continue();
    await expect(checkoutPage.error).toContainText(/Last Name is required/i);
  });

  test('CHK-04 [P1] falta el código postal → error específico', async ({ checkoutPage }) => {
    await checkoutPage.fillInformation(VALID_CHECKOUT.firstName, VALID_CHECKOUT.lastName, '');
    await checkoutPage.continue();
    await expect(checkoutPage.error).toContainText(/Postal Code is required/i);
  });

  test('CHK-05/07 [P0] el resumen cuadra: subtotal = suma de items y total = subtotal + impuesto', async ({
    checkoutPage,
  }) => {
    await checkoutPage.fillInformation(
      VALID_CHECKOUT.firstName,
      VALID_CHECKOUT.lastName,
      VALID_CHECKOUT.postalCode,
    );
    await checkoutPage.continue();

    const subtotal = await checkoutPage.subtotal();
    const tax = await checkoutPage.tax();
    const total = await checkoutPage.total();
    const lineSum = await checkoutPage.lineItemsSum();

    expect(subtotal).toBeCloseTo(lineSum, 2);
    expect(total).toBeCloseTo(subtotal + tax, 2);
  });

  test('CHK-06 [P1] el impuesto es el 8% del subtotal', async ({ checkoutPage }) => {
    await checkoutPage.fillInformation(
      VALID_CHECKOUT.firstName,
      VALID_CHECKOUT.lastName,
      VALID_CHECKOUT.postalCode,
    );
    await checkoutPage.continue();

    const subtotal = await checkoutPage.subtotal();
    const tax = await checkoutPage.tax();
    expect(tax).toBeCloseTo(Number((subtotal * 0.08).toFixed(2)), 2);
  });

  test('CHK-08 [P2] cancelar en el paso de información regresa al carrito', async ({
    checkoutPage,
    page,
  }) => {
    await checkoutPage.cancelButton.click();
    await expect(page).toHaveURL(/cart\.html/);
  });

  test('CHK-09 [P1] tras completar, "Back Home" vuelve al inventario con el carrito vacío', async ({
    checkoutPage,
    inventoryPage,
    page,
  }) => {
    await checkoutPage.fillInformation(
      VALID_CHECKOUT.firstName,
      VALID_CHECKOUT.lastName,
      VALID_CHECKOUT.postalCode,
    );
    await checkoutPage.continue();
    await checkoutPage.finish();
    await checkoutPage.backHome.click();
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });

  test('CHK-10 [P2][edge] el formulario acepta entradas extremas sin romperse', async ({
    checkoutPage,
    page,
  }) => {
    const longName = 'A'.repeat(256);
    await checkoutPage.fillInformation(longName, 'O’Brien-Núñez', '00000-0000');
    await checkoutPage.continue();
    // Debe avanzar (datos no vacíos) sin crash ni error.
    await expect(page).toHaveURL(/checkout-step-two\.html/);
  });
});
