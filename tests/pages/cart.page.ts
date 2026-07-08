import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Página del carrito (/cart.html).
 */
export class CartPage {
  readonly page: Page;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly quantities: Locator;
  readonly checkoutButton: Locator;
  readonly continueShopping: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.items = page.locator('.cart_item');
    this.itemNames = page.locator('.inventory_item_name');
    this.itemPrices = page.locator('.inventory_item_price');
    this.quantities = page.locator('.cart_quantity');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShopping = page.locator('[data-test="continue-shopping"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart.html');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/cart\.html/);
  }

  removeButton(productName: string): Locator {
    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return this.page.locator(`[data-test="remove-${slug}"]`);
  }

  async remove(productName: string): Promise<void> {
    await this.removeButton(productName).click();
  }

  async names(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continue(): Promise<void> {
    await this.continueShopping.click();
  }
}
