import { test, expect } from '@playwright/test';

test.describe('Books E2E: add (review) -> remove', () => {
  test('search, review (add book), then remove review', async ({ page }) => {
    const id = Date.now();
    const username = `e2euser${id}`;
    const email = `${username}@example.com`;
    const password = 'Password1';

    // Register a user (reuse UI flow from auth tests)
    await page.goto('/login');
    await page.getByRole('button', { name: "Don't have an account? Sign up", exact: true }).click();
    await page.fill('#username', username);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await Promise.all([
      page.waitForURL('**/profile'),
      page.locator('form').getByRole('button', { name: 'Sign Up', exact: true }).click()
    ]);

    // Ensure we're on profile
    await expect(page.getByText('My Profile')).toBeVisible();

    // Go to search page and perform a real Google Books search
    // NOTE: backend must be running and `GOOGLE_BOOKS_API_KEY` set for real results
    await page.goto('/search');
    const query = 'Pride and Prejudice';
    await page.fill('input[placeholder="Search..."]', query);
    await Promise.all([
      // the search triggers a backend /api/search call to Google Books
      page.waitForResponse((resp) => resp.url().includes('/api/search') && resp.status() === 200),
      // scope to the search form's submit button to avoid header ambiguity
      page.locator('form').getByRole('button', { name: 'Search', exact: true }).click()
    ]);

    // Use the first visible result block (real search results vary)
    const resultDiv = page.locator('.results-container > div').first();
    await expect(resultDiv).toBeVisible({ timeout: 10000 });
    // Click the Review button in the same result block
    await resultDiv.getByRole('button', { name: 'Review', exact: true }).click();

    // Fill review textarea, pick a rating (click 4th star), and Share
    await resultDiv.locator('.post-Review').fill('This is an automated E2E review');
    // Click the 4th star within the star-rating inside this result
    const postContainer = resultDiv.locator('.post-Container');
    await postContainer.locator('.star-rating span').nth(3).click();
    await Promise.all([
      page.waitForResponse((resp) => resp.url().endsWith('/api/books/add') && resp.status() === 200),
      postContainer.getByRole('button', { name: 'Share', exact: true }).click()
    ]);

    // Expect the in-page notification about adding a review
    await expect(page.getByText('Review added')).toBeVisible();

    // Go to profile and verify the book (by its review text) appears in SharedPosts
    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    await page.waitForURL('**/profile');

    // The UI enriches book titles via Google Books; for fake volume IDs the title
    // may be "Unknown title". The review text is a reliable indicator the post exists.
    const reviewText = 'This is an automated E2E review';
    const postItem = page.locator('li.postItem', { hasText: reviewText });
    await expect(postItem).toBeVisible({ timeout: 10000 });

    // Scroll it into view (in case it's offscreen) before interacting
    await postItem.scrollIntoViewIfNeeded();

    // Delete the review via the Delete button for that post (scoped)
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/books/') && resp.status() === 200),
      postItem.getByRole('button', { name: 'Delete', exact: true }).click()
    ]);

    // Verify the post is removed from the list
    await expect(page.locator('li.postItem', { hasText: reviewText })).toHaveCount(0);
  });
});
