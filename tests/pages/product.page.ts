import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Página de detalle de producto (/inventory-item.html?id=N).
 */
export class ProductPage {
  readonly page: Page;
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly image: Locator;
  readonly backButton: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.name = page.locator('[data-test="inventory-item-name"]');
    this.description = page.locator('[data-test="inventory-item-desc"]');
    this.price = page.locator('[data-test="inventory-item-price"]');
    this.image = page.locator('.inventory_details_img');
    this.backButton = page.locator('[data-test="back-to-products"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  async gotoById(id: number): Promise<void> {
    await this.page.goto(`/inventory-item.html?id=${id}`);
  }

  addButton(): Locator {
    return this.page.locator('button.btn_inventory');
  }

  async addToCart(): Promise<void> {
    await this.addButton().click();
  }

  async backToProducts(): Promise<void> {
    await this.backButton.click();
    await expect(this.page).toHaveURL(/inventory\.html/);
  }
}
