import { test, expect } from '@playwright/test';

test.describe('Friends E2E: create two users and add each other', () => {
  test('create two accounts then add each other by username', async ({ page }) => {
    const id = Date.now();
    const userA = `e2euserA${id}`;
    const emailA = `${userA}@example.com`;
    const userB = `e2euserB${id}`;
    const emailB = `${userB}@example.com`;
    const password = 'Password1';

    // Create user A
    await page.goto('/login');
    await page.getByRole('button', { name: "Don't have an account? Sign up", exact: true }).click();
    await page.fill('#username', userA);
    await page.fill('#email', emailA);
    await page.fill('#password', password);
    await Promise.all([
      page.waitForURL('**/profile'),
      page.locator('form').getByRole('button', { name: 'Sign Up', exact: true }).click()
    ]);
    await expect(page.getByText('My Profile')).toBeVisible();

    // Sign out
    await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
    await expect(page).toHaveURL(/.*\/login$/);

    // Create user B
    await page.getByRole('button', { name: "Don't have an account? Sign up", exact: true }).click();
    await page.fill('#username', userB);
    await page.fill('#email', emailB);
    await page.fill('#password', password);
    await Promise.all([
      page.waitForURL('**/profile'),
      page.locator('form').getByRole('button', { name: 'Sign Up', exact: true }).click()
    ]);
    await expect(page.getByText('My Profile')).toBeVisible();

    // Sign out
    await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
    await expect(page).toHaveURL(/.*\/login$/);

    // Sign in as A
    await page.fill('#email', emailA);
    await page.fill('#password', password);
    await Promise.all([
      page.waitForURL('**/profile'),
      page.locator('form').getByRole('button', { name: 'Login', exact: true }).click()
    ]);
    await expect(page.getByText('My Profile')).toBeVisible();

    // Add user B as friend by username
    await page.fill('input[placeholder="Find friend via username"]', userB);
    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await page.getByRole('button', { name: 'Add Friend', exact: true }).click();

    // Verify B appears in Following list
    await page.getByRole('button', { name: /Following \(\d+\)/ }).click();
    await expect(page.getByText(userB)).toBeVisible();

    // Sign out and sign in as B, then add A back
    await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
    await page.fill('#email', emailB);
    await page.fill('#password', password);
    await Promise.all([
      page.waitForURL('**/profile'),
      page.locator('form').getByRole('button', { name: 'Login', exact: true }).click()
    ]);
    await expect(page.getByText('My Profile')).toBeVisible();

    await page.fill('input[placeholder="Find friend via username"]', userA);
    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await page.getByRole('button', { name: 'Add Friend', exact: true }).click();

    await page.getByRole('button', { name: /Following \(\d+\)/ }).click();
    await expect(page.getByText(userA)).toBeVisible();

    // Clean up: delete user B (currently signed in)
    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await Promise.all([
      page.waitForURL('**/login'),
      page.getByRole('button', { name: 'Delete account', exact: true }).click()
    ]);
    await expect(page).toHaveURL(/.*\/login$/);

    // Sign in as A to delete A as cleanup
    await page.fill('#email', emailA);
    await page.fill('#password', password);
    await Promise.all([
      page.waitForURL('**/profile'),
      page.locator('form').getByRole('button', { name: 'Login', exact: true }).click()
    ]);
    await expect(page.getByText('My Profile')).toBeVisible();

    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await Promise.all([
      page.waitForURL('**/login'),
      page.getByRole('button', { name: 'Delete account', exact: true }).click()
    ]);
    await expect(page).toHaveURL(/.*\/login$/);
  });
});
