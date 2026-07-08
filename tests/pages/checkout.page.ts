import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Flujo de checkout: step-one (formulario), step-two (resumen/totales) y complete.
 */
export class CheckoutPage {
  readonly page: Page;

  // Step one
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly error: Locator;

  // Step two (overview)
  readonly finishButton: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly itemPrices: Locator;

  // Complete
  readonly completeHeader: Locator;
  readonly backHome: Locator;

  constructor(page: Page) {
    this.page = page;

    this.firstName = page.locator('[data-test="firstName"]');
    this.lastName = page.locator('[data-test="lastName"]');
    this.postalCode = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.error = page.locator('[data-test="error"]');

    this.finishButton = page.locator('[data-test="finish"]');
    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.itemPrices = page.locator('.inventory_item_price');

    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.backHome = page.locator('[data-test="back-to-products"]');
  }

  async fillInformation(first: string, last: string, postal: string): Promise<void> {
    await this.firstName.fill(first);
    await this.lastName.fill(last);
    await this.postalCode.fill(postal);
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  private amountFrom(text: string | null): number {
    return Number((text ?? '').replace(/[^0-9.]/g, ''));
  }

  async subtotal(): Promise<number> {
    return this.amountFrom(await this.subtotalLabel.textContent());
  }

  async tax(): Promise<number> {
    return this.amountFrom(await this.taxLabel.textContent());
  }

  async total(): Promise<number> {
    return this.amountFrom(await this.totalLabel.textContent());
  }

  /** Suma de los precios de los items listados en el resumen. */
  async lineItemsSum(): Promise<number> {
    const raw = await this.itemPrices.allTextContents();
    return raw.reduce((acc, p) => acc + this.amountFrom(p), 0);
  }

  async expectOrderComplete(): Promise<void> {
    await expect(this.completeHeader).toHaveText(/thank you for your order/i);
  }
}
