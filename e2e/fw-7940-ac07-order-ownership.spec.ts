import { expect, test } from './fixtures';

test('AC-7: Buy/Long sends coin and direction to a wallet-owned order panel', async ({ page }) => {
    await page.goto('/en/perpetuals?coin=BTC-USDC');
    await page.getByRole('button', { name: 'Buy / Long' }).click();

    const wallet = page.frameLocator('#firefly-wallet-iframe');
    await expect(wallet.getByText('BTC-USDC', { exact: true })).toBeVisible(); // ASSERTION (frozen)
    await expect(wallet.getByRole('tab', { name: 'Buy / Long' })).toHaveAttribute('aria-selected', 'true'); // ASSERTION (frozen)
    await expect(page.locator('main').getByRole('button', { name: /submit order|place order/i })).toHaveCount(0); // ASSERTION (frozen)
});

test('AC-7: Sell/Short sends the opposite direction to the wallet-owned order panel', async ({ page }) => {
    await page.goto('/en/perpetuals?coin=ETH-USDC');
    await page.getByRole('button', { name: 'Sell / Short' }).click();

    const wallet = page.frameLocator('#firefly-wallet-iframe');
    await expect(wallet.getByText('ETH-USDC', { exact: true })).toBeVisible(); // ASSERTION (frozen)
    await expect(wallet.getByRole('tab', { name: 'Sell / Short' })).toHaveAttribute('aria-selected', 'true'); // ASSERTION (frozen)
});
