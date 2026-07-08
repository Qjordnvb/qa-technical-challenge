import { test, expect } from '../fixtures/test';
import { USERS } from '../fixtures/users';

/**
 * Seguridad de sesión — las páginas protegidas no deben ser accesibles por URL
 * sin una sesión válida. Un fallo aquí es una fuga de control de acceso.
 */
test.describe('Seguridad de sesión', () => {
  const protectedPaths = [
    { id: 'SEC-01', path: '/inventory.html', priority: 'P0' },
    { id: 'SEC-02', path: '/cart.html', priority: 'P0' },
    { id: 'SEC-03', path: '/checkout-step-one.html', priority: 'P1' },
  ];

  for (const { id, path, priority } of protectedPaths) {
    test(`${id} [${priority}] ${path} sin sesión redirige al login con error`, async ({
      page,
      loginPage,
    }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/saucedemo\.com\/?$/);
      await expect(loginPage.error).toContainText(/you can only access.*when you are logged in/i);
    });
  }

  test('SEC-04 [P1] tras logout, el botón "atrás" no restaura la sesión', async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.goto();
    await loginPage.loginExpectingSuccess(USERS.standard.username);
    await inventoryPage.menu.doLogout();
    await expect(loginPage.loginButton).toBeVisible();

    await page.goBack();
    // No debe quedar contenido protegido accesible: sigue en login o es redirigido.
    await expect(loginPage.loginButton).toBeVisible();
    await expect(inventoryPage.items).toHaveCount(0);
  });
});
