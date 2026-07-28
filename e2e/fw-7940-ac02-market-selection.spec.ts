import { expect, test } from './fixtures';

test('AC-2: market search and selection update a refresh-safe URL', async ({ page }) => {
    await page.goto('/en/perpetuals');

    await page.getByRole('button', { name: /select market/i }).click();
    await page.getByRole('searchbox', { name: /search markets/i }).fill('ETH');
    await page.getByRole('option', { name: 'ETH-USDC' }).click();

    await expect(page).toHaveURL(/coin=ETH-USDC/); // ASSERTION (frozen)
    await expect(page.getByTestId('perps-selected-market')).toHaveText('ETH-USDC'); // ASSERTION (frozen)

    await page.reload();
    await expect(page.getByTestId('perps-selected-market')).toHaveText('ETH-USDC'); // ASSERTION (frozen)
});
