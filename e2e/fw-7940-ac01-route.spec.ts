import { expect, test } from './fixtures';

test('AC-1: localized Perpetuals route selects the sidebar entry and defaults to BTC-USDC', async ({ page }) => {
    await page.goto('/en/perpetuals');

    await expect(page).toHaveURL(/\/en\/perpetuals/); // ASSERTION (frozen)
    await expect(page.getByRole('link', { name: 'Perpetuals' })).toHaveAttribute('aria-current', 'page'); // ASSERTION (frozen)
    await expect(page.getByTestId('perps-selected-market')).toHaveText('BTC-USDC'); // ASSERTION (frozen)
});
