import { test, expect } from '@playwright/test';

test('home loads and shows header/banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Work in Progress: crafted by Sam')).toBeVisible();
  await expect(page.getByRole('link', { name: /samvannoord\.nl/i })).toBeVisible();
});

