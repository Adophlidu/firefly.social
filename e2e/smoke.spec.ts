import { expect, test } from './fixtures';

/**
 * Infra smoke test: proves we can attach to the user's Chrome over CDP and drive a page,
 * without depending on the dev server being up. `/ff-task` generates real feature specs
 * alongside this one; this just validates the CDP plumbing.
 */
test('smoke: attaches to Chrome over CDP and controls a page', async ({ page }) => {
    await page.goto('data:text/html,<title>ff-e2e smoke</title><h1>ok</h1>');

    await expect(page).toHaveTitle('ff-e2e smoke');
    await expect(page.getByRole('heading', { name: 'ok' })).toBeVisible();
});
