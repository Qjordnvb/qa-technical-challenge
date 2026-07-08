import { test, expect } from '../fixtures/test';
import { USERS, PASSWORD } from '../fixtures/users';

/**
 * Autenticación — la puerta de entrada al negocio.
 * Cubre happy path, negativos, control de acceso y seguridad de los campos.
 */
test.describe('Autenticación', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('AUTH-01 [P0] standard_user inicia sesión y llega al inventario', async ({
    loginPage,
    page,
  }) => {
    await loginPage.loginExpectingSuccess(USERS.standard.username);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('AUTH-02 [P0] locked_out_user es rechazado con mensaje de bloqueo', async ({
    loginPage,
  }) => {
    await loginPage.login(USERS.locked.username);
    await expect(loginPage.error).toContainText(/locked out/i);
  });

  test('AUTH-03 [P1] usuario vacío muestra "Username is required"', async ({ loginPage }) => {
    await loginPage.login('', PASSWORD);
    await expect(loginPage.error).toContainText(/Username is required/i);
  });

  test('AUTH-04 [P1] contraseña vacía muestra "Password is required"', async ({ loginPage }) => {
    await loginPage.login(USERS.standard.username, '');
    await expect(loginPage.error).toContainText(/Password is required/i);
  });

  test('AUTH-05 [P1] credenciales incorrectas muestran error genérico', async ({ loginPage }) => {
    await loginPage.login(USERS.standard.username, 'wrong_password');
    await expect(loginPage.error).toContainText(/do not match/i);
  });

  test('AUTH-06 [P1] el campo de contraseña está enmascarado', async ({ loginPage }) => {
    await expect(loginPage.password).toHaveAttribute('type', 'password');
  });

  test('AUTH-07 [P0] logout limpia la sesión y vuelve al login', async ({
    loginPage,
    inventoryPage,
    page,
  }) => {
    await loginPage.loginExpectingSuccess(USERS.standard.username);
    await inventoryPage.menu.doLogout();
    await expect(page).toHaveURL(/saucedemo\.com\/?$/);
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('AUTH-08 [P2][a11y] se puede iniciar sesión con la tecla Enter', async ({
    loginPage,
    page,
  }) => {
    await loginPage.fill(USERS.standard.username, PASSWORD);
    await loginPage.password.press('Enter');
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('AUTH-09 [P2] el mensaje de error se puede cerrar', async ({ loginPage }) => {
    await loginPage.login(USERS.locked.username);
    await expect(loginPage.error).toBeVisible();
    await loginPage.errorClose.click();
    await expect(loginPage.error).toHaveCount(0);
  });

  test('AUTH-10 [P2][seguridad] un payload tipo script no se ejecuta ni autentica', async ({
    loginPage,
    page,
  }) => {
    await loginPage.login('<script>alert(1)</script>', PASSWORD);
    // No debe autenticar ni provocar un diálogo; permanece en login con error.
    await expect(page).not.toHaveURL(/inventory\.html/);
    await expect(loginPage.error).toBeVisible();
  });

  test('AUTH-11 [P3] credenciales solo con espacios son rechazadas', async ({ loginPage, page }) => {
    await loginPage.login('   ', '   ');
    await expect(page).not.toHaveURL(/inventory\.html/);
    await expect(loginPage.error).toBeVisible();
  });
});
