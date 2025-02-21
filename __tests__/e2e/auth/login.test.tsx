import { test, expect, type Page } from '@playwright/test';

test.describe('Login E2E', () => {
  test('completes full login flow', async ({ page }: { page: Page }) => {
    await page.goto('/login');
    
    await page.fill('[aria-label="Email"]', 'test@example.com');
    await page.fill('[aria-label="Password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/overview');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }: { page: Page }) => {
    await page.goto('/login');
    
    await page.fill('[aria-label="Email"]', 'wrong@example.com');
    await page.fill('[aria-label="Password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });
}); 