import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { ProductPage } from '../pages/product.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { USERS } from './users';

/**
 * Fixtures reutilizables:
 *  - Page Objects listos para usar en cada test.
 *  - `loginAsStandard`: deja la sesión iniciada con standard_user en el inventario.
 *
 * Cada test recibe una página limpia (contexto aislado por Playwright), así que
 * los tests son independientes y sin estado compartido.
 */
type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  loginAsStandard: InventoryPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  loginAsStandard: async ({ page }, use) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);
    await login.goto();
    await login.loginExpectingSuccess(USERS.standard.username);
    await inventory.expectLoaded();
    await use(inventory);
  },
});

export { expect };
