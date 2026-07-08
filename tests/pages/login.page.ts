import { type Page, type Locator, expect } from '@playwright/test';
import { PASSWORD } from '../fixtures/users';

/**
 * Página de login (/). Locators por placeholder/role para evitar CSS frágil.
 */
export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;
  readonly errorClose: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.error = page.locator('[data-test="error"]');
    this.errorClose = page.locator('[data-test="error-button"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.loginButton).toBeVisible();
  }

  async fill(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
  }

  async login(username: string, password: string = PASSWORD): Promise<void> {
    await this.fill(username, password);
    await this.loginButton.click();
  }

  /** Login que además espera aterrizar en el inventario. */
  async loginExpectingSuccess(username: string, password: string = PASSWORD): Promise<void> {
    await this.login(username, password);
    await this.page.waitForURL('**/inventory.html');
  }
}
