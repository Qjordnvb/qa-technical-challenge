import { type Page, type Locator } from '@playwright/test';

/**
 * Menú lateral (burger). Componente compartido por todas las páginas autenticadas.
 */
export class MenuComponent {
  readonly page: Page;
  readonly openButton: Locator;
  readonly closeButton: Locator;
  readonly allItems: Locator;
  readonly about: Locator;
  readonly logout: Locator;
  readonly resetAppState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.openButton = page.getByRole('button', { name: 'Open Menu' });
    this.closeButton = page.getByRole('button', { name: 'Close Menu' });
    this.allItems = page.locator('#inventory_sidebar_link');
    this.about = page.locator('#about_sidebar_link');
    this.logout = page.locator('#logout_sidebar_link');
    this.resetAppState = page.locator('#reset_sidebar_link');
  }

  async open(): Promise<void> {
    await this.openButton.click();
    await this.logout.waitFor({ state: 'visible' });
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async doLogout(): Promise<void> {
    await this.open();
    await this.logout.click();
  }

  async doResetAppState(): Promise<void> {
    await this.open();
    await this.resetAppState.click();
    await this.close();
  }
}
