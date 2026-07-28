import { expect, test } from './fixtures';

test('AC-17: Perpetuals controls, tooltips, and account tables expose non-color accessible semantics', async ({
    page,
}) => {
    await page.goto('/en/perpetuals');

    const buy = page.getByRole('button', { name: 'Buy / Long' });
    const sell = page.getByRole('button', { name: 'Sell / Short' });
    await expect(buy).toBeVisible(); // ASSERTION (frozen) — direction is conveyed by text
    await expect(sell).toBeVisible(); // ASSERTION (frozen) — direction is conveyed by text

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus-visible')).toBeVisible(); // ASSERTION (frozen)

    const tooltipTrigger = page.getByRole('button', { name: /about mark/i });
    await tooltipTrigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tooltip')).toBeVisible(); // ASSERTION (frozen)

    await expect(page.getByRole('tab', { name: /positions/i })).toBeVisible(); // ASSERTION (frozen)
    await expect(page.getByRole('columnheader').first()).toBeVisible(); // ASSERTION (frozen)
});
