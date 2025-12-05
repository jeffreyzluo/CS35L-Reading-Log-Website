import { test, expect } from '@playwright/test';

test.describe('Auth E2E: sign up, sign out, sign in, delete account', () => {
  test('signup -> signout -> signin -> delete account', async ({ page }) => {
    const id = Date.now();
    const username = `e2euser${id}`;
    const email = `${username}@example.com`;
    const password = 'Password1';

    // Go to login page
    await page.goto('/login');

    // Switch to Sign Up mode (exact toggle text on Login page)
    await page.getByRole('button', { name: "Don't have an account? Sign up", exact: true }).click();

    // Fill sign up form
    await page.fill('#username', username);
    await page.fill('#email', email);
    await page.fill('#password', password);

    // Submit sign up (scope to form to avoid matching header button)
    await Promise.all([
      page.waitForURL('**/profile'),
      page.locator('form').getByRole('button', { name: 'Sign Up', exact: true }).click()
    ]);

    // We should be on profile
    await expect(page).toHaveURL(/.*\/profile(\/.*)?$/);
    await expect(page.getByText('My Profile')).toBeVisible();

    // Sign out
    await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
    await expect(page).toHaveURL(/.*\/login$/);

    // Sign in again
    await page.fill('#email', email);
    await page.fill('#password', password);
    await Promise.all([
      page.waitForURL('**/profile'),
      page.locator('form').getByRole('button', { name: 'Login', exact: true }).click()
    ]);
    await expect(page.getByText('My Profile')).toBeVisible();

    // Delete account: accept confirm dialog then click Delete account
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await Promise.all([
      page.waitForURL('**/login'),
      page.getByRole('button', { name: 'Delete account', exact: true }).click()
    ]);

    // After deletion we should be returned to login
    await expect(page).toHaveURL(/.*\/login$/);

    // Attempt to sign in again; it should not navigate to profile
    let sawAlert = false;
    page.once('dialog', async (d) => { sawAlert = true; await d.accept(); });

    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.locator('form').getByRole('button', { name: 'Login', exact: true }).click();

    // Give a brief moment for possible navigation or dialog
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*\/login$/);
    expect(sawAlert).toBeTruthy();
  });
});
