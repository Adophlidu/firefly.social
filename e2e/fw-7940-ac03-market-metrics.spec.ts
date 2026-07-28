import { expect, test } from './fixtures';

const METRICS = ['Maximum leverage', 'Mark', 'Oracle', '24h Change', '24h Volume', 'Open Interest', 'Funding'];

test('AC-3: ticker metrics render values and tooltip triggers are keyboard accessible', async ({ page }) => {
    await page.goto('/en/perpetuals?coin=BTC-USDC');

    for (const label of METRICS) {
        const metric = page.getByTestId('perps-market-metric').filter({ hasText: label });
        await expect(metric).toBeVisible(); // ASSERTION (frozen)
        await expect(metric.getByTestId('perps-market-metric-value')).not.toHaveText(''); // ASSERTION (frozen)
    }

    const markValue = page
        .getByTestId('perps-market-metric')
        .filter({ hasText: 'Mark' })
        .getByTestId('perps-market-metric-value');
    const initialMark = await markValue.textContent();
    await expect.poll(() => markValue.textContent(), { timeout: 30_000 }).not.toBe(initialMark); // ASSERTION (frozen) — the public subscription can update the ticker

    for (const name of [/about mark/i, /about oracle/i, /about open interest/i, /about funding/i]) {
        const help = page.getByRole('button', { name });
        await help.focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('tooltip')).toBeVisible(); // ASSERTION (frozen)
        await page.keyboard.press('Escape');
    }
});
