import { test, expect } from '@playwright/test';

test.describe('Preview route', () => {
  test('renders a valid page from the content source', async ({ page }) => {
    await page.goto('/preview/home');
    //await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#hero-heading')).toBeVisible();
    await expect(page.getByText('Ship landing pages without shipping code')).toBeVisible();
  });

  test('CTA link is present and interactive', async ({ page }) => {
    await page.goto('/preview/home');
    const cta = page.getByTestId('cta-link');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/studio/home');
  });

  // test('does not crash on a page with unknown/invalid sections', async ({ page }) => {
  //   await page.goto('/preview/broken');
  //   await expect(page.getByText('This one is fine')).toBeVisible();
  //   await expect(page.getByText(/Unsupported section/i).first()).toBeVisible();
  // });

  test('shows a friendly message for a missing slug instead of an error page', async ({ page }) => {
    const response = await page.goto('/preview/does-not-exist');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText('Page not found')).toBeVisible();
  });
});
