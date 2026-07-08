import { type Page, type Locator, expect } from '@playwright/test';
import { MenuComponent } from './menu.component';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * Página de inventario (/inventory.html): listado de productos, carrito y orden.
 */
export class InventoryPage {
  readonly page: Page;
  readonly menu: MenuComponent;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemImages: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly sortSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menu = new MenuComponent(page);
    this.items = page.locator('.inventory_item');
    this.itemNames = page.locator('.inventory_item_name');
    this.itemPrices = page.locator('.inventory_item_price');
    this.itemImages = page.locator('.inventory_item_img img');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.sortSelect = page.locator('[data-test="product-sort-container"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.items.first()).toBeVisible();
  }

  /** Convierte un nombre de producto en el slug usado por los data-test. */
  private slug(productName: string): string {
    return productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  addButton(productName: string): Locator {
    return this.page.locator(`[data-test="add-to-cart-${this.slug(productName)}"]`);
  }

  removeButton(productName: string): Locator {
    return this.page.locator(`[data-test="remove-${this.slug(productName)}"]`);
  }

  async addToCart(productName: string): Promise<void> {
    await this.addButton(productName).click();
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.removeButton(productName).click();
  }

  async cartCount(): Promise<number> {
    if (!(await this.cartBadge.isVisible())) return 0;
    return Number(await this.cartBadge.textContent());
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async openProduct(productName: string): Promise<void> {
    await this.itemNames.filter({ hasText: productName }).click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  /** Nombres de producto en el orden en que aparecen actualmente. */
  async names(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  /** Precios numéricos en el orden en que aparecen actualmente. */
  async prices(): Promise<number[]> {
    const raw = await this.itemPrices.allTextContents();
    return raw.map((p) => Number(p.replace('$', '')));
  }
}
