import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Sample UI E2E test — a starting point to adapt live.
 *
 * Good-practice signals baked in:
 *  - Small Page Object to keep the spec free of raw selectors
 *  - Role/label locators preferred over brittle CSS/XPath
 *  - Web-first assertions (auto-waiting) instead of manual sleeps
 *  - Each test is independent
 */

class HomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly moreInfoLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.moreInfoLink = page.getByRole('link', { name: /more information/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}

test.describe('Home page', () => {
  test('loads and shows the main heading', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.heading).toBeVisible();
    await expect(page).toHaveTitle(/example/i);
  });


});
