import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

/**
 * FW-7696 — share a single Polymarket position (apps/web flows).
 *
 * RED until the feature is implemented — expected.
 *
 * Data prerequisites (CDP-attached Chrome is already logged in):
 * - FF_E2E_FW7696_PROFILE_ADDRESS — a Polymarket proxy address whose profile detail page
 *   (`/polymarket/profile/{address}`) lists at least one position cell. Tests that need it are
 *   skipped (with this message) when unset, so the orchestrator must provide it for a real run.
 * - FF_E2E_FW7696_TIMELINE_PATH — a page path whose timeline shows at least one prediction
 *   activity with the existing share menu (for AC-13).
 *
 * The workers share-image endpoint is STUBBED via page.route (fulfilled with a tiny PNG, or
 * aborted for the error path), so these tests do not depend on the firefly-workers deploy (R3).
 *
 * Frozen vs negotiable:
 * - Assertions marked `// ASSERTION (frozen)` (menu copy "Post with image" / "Share image",
 *   option order, image attached to compose, market link with `sid` in the compose text,
 *   error toast without crash, preview modal buttons) are the spec contract — do not weaken.
 * - The data-testid selectors below are interface wiring — the implementer may reconcile them
 *   with the real markup (and should add testids where noted), but not the assertions.
 */

const PROFILE_ADDRESS = process.env.FF_E2E_FW7696_PROFILE_ADDRESS;
const TIMELINE_PATH = process.env.FF_E2E_FW7696_TIMELINE_PATH;

const SHARE_IMAGE_ENDPOINT = '**/polymarket/share-image*';

// 1x1 transparent PNG.
const TINY_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
);

// ---- selector wiring (negotiable) ------------------------------------------------------------

function positionCell(page: Page) {
    return page.getByTestId('prediction-position-item').first();
}

function positionShareEntry(page: Page) {
    return page.getByTestId('prediction-position-share').first();
}

function timelineShareTrigger(page: Page) {
    return page.getByTestId('prediction-activity-share').first();
}

function openDialog(page: Page) {
    // The headlessui Dialog root is a zero-size `relative` wrapper (Playwright reports it hidden);
    // its `fixed inset-0` child carries the actual layout box. Scope to headlessui ids so the
    // Next.js dev-tools error-overlay dialog is never matched.
    return page.locator('[role="dialog"][id*="headlessui"] > div').last();
}

// ---- shared steps -----------------------------------------------------------------------------

// The copy assertions are the English spec strings, so force the English locale segment
// regardless of the user's Chrome/profile language.
function localized(path: string) {
    return `/en${path}`;
}

async function openPositionShareMenu(page: Page) {
    await page.goto(localized(`/polymarket/profile/${PROFILE_ADDRESS}`));
    const cell = positionCell(page);
    await expect(cell).toBeVisible();
    await cell.hover();
    const entry = positionShareEntry(page);
    await expect(entry).toBeVisible();
    await entry.click();
}

async function stubShareImageEndpoint(page: Page) {
    await page.route(SHARE_IMAGE_ENDPOINT, (route) =>
        route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG }),
    );
}

test.describe('FW-7696 share single Polymarket position', () => {
    test('AC-9: profile position cell shows a hover share entry with Post with image / Share image', async ({
        page,
    }) => {
        test.skip(!PROFILE_ADDRESS, 'set FF_E2E_FW7696_PROFILE_ADDRESS to a profile with positions');

        await page.goto(localized(`/polymarket/profile/${PROFILE_ADDRESS}`));
        const cell = positionCell(page);
        await expect(cell).toBeVisible();

        await cell.hover();
        await expect(positionShareEntry(page)).toBeVisible(); // ASSERTION (frozen)

        await positionShareEntry(page).click();
        await expect(page.getByText('Post with image', { exact: true })).toBeVisible(); // ASSERTION (frozen)
        await expect(page.getByText('Share image', { exact: true })).toBeVisible(); // ASSERTION (frozen)
    });

    test('AC-13: timeline share menu gains both options ABOVE Post with link / Copy link', async ({ page }) => {
        test.skip(!TIMELINE_PATH, 'set FF_E2E_FW7696_TIMELINE_PATH to a page with prediction activities');

        await page.goto(localized(TIMELINE_PATH as string));
        await expect(timelineShareTrigger(page)).toBeVisible();

        // Activities missing price data legitimately render no image options (payload is null),
        // so walk the timeline triggers until one exposes them.
        const triggers = page.getByTestId('prediction-activity-share');
        const count = Math.min(await triggers.count(), 8);
        let found = false;
        for (let i = 0; i < count; i += 1) {
            await triggers.nth(i).click();
            if (
                await page
                    .getByText('Post with image', { exact: true })
                    .isVisible({ timeout: 2000 })
                    .catch(() => false)
            ) {
                found = true;
                break;
            }
            await page.keyboard.press('Escape');
        }
        if (!found) throw new Error('no timeline activity exposed the image share options');

        const postWithImage = page.getByText('Post with image', { exact: true });
        const shareImage = page.getByText('Share image', { exact: true });
        const postWithLink = page.getByText('Post with link', { exact: true });
        const copyLink = page.getByText('Copy link', { exact: true });

        await expect(postWithImage).toBeVisible(); // ASSERTION (frozen)
        await expect(shareImage).toBeVisible(); // ASSERTION (frozen)
        await expect(postWithLink).toBeVisible(); // ASSERTION (frozen)
        await expect(copyLink).toBeVisible(); // ASSERTION (frozen)

        const [imageBox, shareBox, linkBox] = await Promise.all([
            postWithImage.boundingBox(),
            shareImage.boundingBox(),
            postWithLink.boundingBox(),
        ]);
        if (!imageBox || !shareBox || !linkBox) throw new Error('share menu options have no layout box');

        // Design order: Post with image, then Share image, both above the pre-existing options.
        expect(imageBox.y).toBeLessThan(shareBox.y); // ASSERTION (frozen)
        expect(shareBox.y).toBeLessThan(linkBox.y); // ASSERTION (frozen)
    });

    test('AC-15 (web): Post with image opens compose with the PNG attached and the market link with sid', async ({
        page,
    }) => {
        test.skip(!PROFILE_ADDRESS, 'set FF_E2E_FW7696_PROFILE_ADDRESS to a profile with positions');

        await stubShareImageEndpoint(page);
        await openPositionShareMenu(page);
        await page.getByText('Post with image', { exact: true }).click();

        const compose = openDialog(page);
        await expect(compose).toBeVisible(); // ASSERTION (frozen)
        await expect(compose.locator('img').first()).toBeVisible(); // ASSERTION (frozen) — image attached
        await expect(compose).toContainText('/polymarket/event/'); // ASSERTION (frozen) — market detail link
        await expect(compose).toContainText('sid='); // ASSERTION (frozen) — sharer uid param
    });

    test('AC-15 (error path): image generation failure shows an error toast and does not crash', async ({ page }) => {
        test.skip(!PROFILE_ADDRESS, 'set FF_E2E_FW7696_PROFILE_ADDRESS to a profile with positions');

        await page.route(SHARE_IMAGE_ENDPOINT, (route) => route.abort());
        await openPositionShareMenu(page);
        await page.getByText('Post with image', { exact: true }).click();

        // An error toast/snackbar becomes visible (copy is i18n'd, so match the container role).
        await expect(page.locator('[role="alert"], [class*="nackbar"]').first()).toBeVisible(); // ASSERTION (frozen)

        // No crash: the page is still interactive and the position list is still there.
        await expect(positionCell(page)).toBeVisible(); // ASSERTION (frozen)
    });

    test('AC-16: Share image opens a preview modal with Copy / Download / Post', async ({ page }) => {
        test.skip(!PROFILE_ADDRESS, 'set FF_E2E_FW7696_PROFILE_ADDRESS to a profile with positions');

        await stubShareImageEndpoint(page);
        await openPositionShareMenu(page);
        await page.getByText('Share image', { exact: true }).click();

        const modal = openDialog(page);
        await expect(modal).toBeVisible(); // ASSERTION (frozen)
        await expect(modal.locator('img').first()).toBeVisible(); // ASSERTION (frozen) — image preview

        // Chrome supports ClipboardItem, so Copy must be available (degrade rule only applies
        // when unsupported).
        await expect(modal.getByText('Copy', { exact: true })).toBeVisible(); // ASSERTION (frozen)
        await expect(modal.getByText('Post', { exact: true })).toBeVisible(); // ASSERTION (frozen)

        const download = modal.getByText('Download', { exact: true });
        await expect(download).toBeVisible(); // ASSERTION (frozen)

        const downloadEvent = page.waitForEvent('download');
        await download.click();
        const file = await downloadEvent;
        expect(file.suggestedFilename().toLowerCase().endsWith('.png')).toBe(true); // ASSERTION (frozen)
    });
});
