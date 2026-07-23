import { expect, test } from './fixtures';

test('AC-6: account values and Deposit open the matching wallet-owned destinations', async ({ page }) => {
    await page.goto('/en/perpetuals');

    await page.getByRole('button', { name: /portfolio|account value/i }).click();
    const wallet = page.frameLocator('#firefly-wallet-iframe');
    await expect(wallet.getByRole('heading', { name: /perps account/i })).toBeVisible(); // ASSERTION (frozen)

    await page.getByRole('button', { name: 'Deposit' }).click();
    await expect(wallet.getByRole('heading', { name: 'Add Funds' })).toBeVisible(); // ASSERTION (frozen)
});
