import { expect, test } from './fixtures';

function boxesOverlap(
    first: { x: number; y: number; width: number; height: number },
    second: { x: number; y: number; width: number; height: number },
) {
    return !(
        first.x + first.width <= second.x ||
        second.x + second.width <= first.x ||
        first.y + first.height <= second.y ||
        second.y + second.height <= first.y
    );
}

test('AC-4: chart and order book do not overlap at existing web breakpoints', async ({ page }) => {
    for (const viewport of [
        { width: 1440, height: 894 },
        { width: 1024, height: 900 },
    ]) {
        await page.setViewportSize(viewport);
        await page.goto('/en/perpetuals?coin=SOL-USDC');

        const chart = page.getByTestId('perps-chart');
        const orderBook = page.getByTestId('perps-order-book');
        await expect(chart).toBeVisible(); // ASSERTION (frozen)
        await expect(orderBook).toBeVisible(); // ASSERTION (frozen)

        const [chartBox, orderBookBox] = await Promise.all([chart.boundingBox(), orderBook.boundingBox()]);
        if (!chartBox || !orderBookBox) throw new Error('Perpetuals panels have no layout box');
        expect(boxesOverlap(chartBox, orderBookBox)).toBe(false); // ASSERTION (frozen)
    }
});

test('AC-4: a deep-linked market survives refresh', async ({ page }) => {
    await page.goto('/en/perpetuals?coin=SOL-USDC');

    await page.reload();
    await expect(page.getByTestId('perps-selected-market')).toHaveText('SOL-USDC'); // ASSERTION (frozen)
});
