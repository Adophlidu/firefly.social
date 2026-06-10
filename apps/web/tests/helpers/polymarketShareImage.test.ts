import { describe, expect, it } from 'vitest';

import {
    buildPolymarketEventShareUrl,
    buildPolymarketProfileShareUrl,
    buildPolymarketShareImageUrl,
    computeTimelinePnlRate,
    formatSharePnlHeadline,
    resolvePolymarketShareIdentity,
} from '@/helpers/polymarketShareImage.js';

/**
 * FW-7696 — unit tests for the share-image pure helpers (spec AC-14, AC-18).
 *
 * RED until `@/helpers/polymarketShareImage.js` is implemented — expected.
 *
 * Frozen vs negotiable:
 * - Lines marked `// ASSERTION (frozen)` are the contract from `.ff-task/FW-7696/spec.md`
 *   (identity priority order, the `(cur − avg) / avg` timeline formula, the Full Loss rule at
 *   exactly -100%, the firefly QR/share links, encoding round-trips). Do NOT weaken them.
 * - Function names, the import path, and parameter object shapes are interface wiring — the
 *   implementer may reconcile them (and only them) with the real API.
 */

function identity(displayName: string) {
    return { displayName, avatarUrl: `https://example.com/${displayName}.png` };
}

describe('resolvePolymarketShareIdentity (AC-14)', () => {
    const all = {
        firefly: identity('ff-user'),
        polymarket: identity('poly-user'),
        twitter: identity('x-user'),
        lens: identity('lens-user'),
        farcaster: identity('fc-user'),
        bluesky: identity('bsky-user'),
    };

    it('prefers the firefly account over everything else', () => {
        expect(resolvePolymarketShareIdentity(all)?.displayName).toBe('ff-user'); // ASSERTION (frozen)
    });

    it('falls back to the polymarket account when firefly is absent', () => {
        const candidates = { ...all, firefly: undefined };
        expect(resolvePolymarketShareIdentity(candidates)?.displayName).toBe('poly-user'); // ASSERTION (frozen)
    });

    it('falls back to X when firefly and polymarket are absent', () => {
        const candidates = { ...all, firefly: undefined, polymarket: undefined };
        expect(resolvePolymarketShareIdentity(candidates)?.displayName).toBe('x-user'); // ASSERTION (frozen)
    });

    it('prefers Lens over Farcaster and Bluesky', () => {
        const candidates = {
            lens: identity('lens-user'),
            farcaster: identity('fc-user'),
            bluesky: identity('bsky-user'),
        };
        expect(resolvePolymarketShareIdentity(candidates)?.displayName).toBe('lens-user'); // ASSERTION (frozen)
    });

    it('prefers Farcaster over Bluesky', () => {
        const candidates = {
            farcaster: identity('fc-user'),
            bluesky: identity('bsky-user'),
        };
        expect(resolvePolymarketShareIdentity(candidates)?.displayName).toBe('fc-user'); // ASSERTION (frozen)
    });

    it('uses Bluesky as the last resort', () => {
        expect(resolvePolymarketShareIdentity({ bluesky: identity('bsky-user') })?.displayName).toBe('bsky-user'); // ASSERTION (frozen)
    });

    it('resolves to no identity when no candidate is available', () => {
        expect(resolvePolymarketShareIdentity({}) ?? null).toBeNull(); // ASSERTION (frozen)
    });
});

describe('computeTimelinePnlRate (AC-18 — timeline pnl formula (cur − avg) / avg, in percent)', () => {
    it('computes a gain: avg 0.5 → cur 0.75 = +50%', () => {
        expect(computeTimelinePnlRate({ averagePrice: 0.5, currentPrice: 0.75 })).toBe(50); // ASSERTION (frozen)
    });

    it('computes a loss: avg 0.8 → cur 0.4 = -50%', () => {
        expect(computeTimelinePnlRate({ averagePrice: 0.8, currentPrice: 0.4 })).toBe(-50); // ASSERTION (frozen)
    });

    it('computes break-even: avg 0.5 → cur 0.5 = 0%', () => {
        expect(computeTimelinePnlRate({ averagePrice: 0.5, currentPrice: 0.5 })).toBe(0); // ASSERTION (frozen)
    });

    it('computes a full loss: avg 0.25 → cur 0 = -100%', () => {
        expect(computeTimelinePnlRate({ averagePrice: 0.25, currentPrice: 0 })).toBe(-100); // ASSERTION (frozen)
    });

    it('keeps fractional precision: avg 0.3 → cur 0.4 ≈ +33.33%', () => {
        expect(computeTimelinePnlRate({ averagePrice: 0.3, currentPrice: 0.4 })).toBeCloseTo(33.333, 2); // ASSERTION (frozen)
    });
});

describe('formatSharePnlHeadline (AC-18 — pnl formatting + Full Loss rule)', () => {
    it('formats a positive rate with an explicit plus sign', () => {
        const result = formatSharePnlHeadline(25);
        expect(result.label).toBe('+25%'); // ASSERTION (frozen)
        expect(result.positive).toBe(true); // ASSERTION (frozen) — spec: green for >= 0
    });

    it('treats zero as positive (green)', () => {
        const result = formatSharePnlHeadline(0);
        expect(result.label).toMatch(/^\+?0%$/); // ASSERTION (frozen)
        expect(result.positive).toBe(true); // ASSERTION (frozen)
    });

    it('formats a negative rate', () => {
        const result = formatSharePnlHeadline(-30);
        expect(result.label).toBe('-30%'); // ASSERTION (frozen)
        expect(result.positive).toBe(false); // ASSERTION (frozen) — spec: red for < 0
    });

    it('replaces -100% with the red "Full Loss" headline', () => {
        const result = formatSharePnlHeadline(-100);
        expect(result.label).toBe('Full Loss'); // ASSERTION (frozen)
        expect(result.positive).toBe(false); // ASSERTION (frozen)
    });

    it('does NOT treat -99% as a full loss', () => {
        expect(formatSharePnlHeadline(-99).label).toBe('-99%'); // ASSERTION (frozen)
    });
});

describe('buildPolymarketEventShareUrl / buildPolymarketProfileShareUrl (AC-15 / AC-12 QR links)', () => {
    it('builds the market detail link with the sharer uid', () => {
        expect(buildPolymarketEventShareUrl('will-x-happen', 'uid-1')).toBe(
            'https://firefly.social/polymarket/event/will-x-happen?sid=uid-1',
        ); // ASSERTION (frozen)
    });

    it('omits the sid param when no sharer uid is available', () => {
        expect(buildPolymarketEventShareUrl('will-x-happen')).toBe(
            'https://firefly.social/polymarket/event/will-x-happen',
        ); // ASSERTION (frozen)
    });

    it('builds the wallet profile link (multi-winnings QR) with the sharer uid', () => {
        const proxyAddress = `0x${'ab'.repeat(20)}`;
        expect(buildPolymarketProfileShareUrl(proxyAddress, 'uid-1')).toBe(
            `https://firefly.social/polymarket/profile/${proxyAddress}?sid=uid-1`,
        ); // ASSERTION (frozen)
    });
});

describe('buildPolymarketShareImageUrl (AC-18 — endpoint URL builder)', () => {
    const qrUrl = 'https://firefly.social/polymarket/event/will-x-happen?sid=uid-1';

    function buildPositionUrl(overrides: Record<string, unknown> = {}) {
        return buildPolymarketShareImageUrl({
            type: 'position',
            title: 'Will 50% & more “special” chars survive?',
            outcome: 'Yes',
            status: 'active',
            pnlRate: 25,
            totalCost: 120.5,
            avgPrice: 0.48,
            currentPnl: 30.12,
            identity: { displayName: 'ff-user' },
            qrUrl,
            ...overrides,
        });
    }

    it('targets the workers share-image endpoint', () => {
        const url = new URL(buildPositionUrl());
        expect(url.pathname.endsWith('/polymarket/share-image')).toBe(true); // ASSERTION (frozen) — spec A1
    });

    it('round-trips the title through param encoding (special characters intact)', () => {
        const values = Array.from(new URL(buildPositionUrl()).searchParams.values());
        expect(values).toContain('Will 50% & more “special” chars survive?'); // ASSERTION (frozen)
    });

    it('passes the exact qrUrl (market detail link with sid) through to the endpoint', () => {
        const values = Array.from(new URL(buildPositionUrl()).searchParams.values());
        expect(values).toContain(qrUrl); // ASSERTION (frozen) — input side of AC-7
    });

    it('carries the resolved identity name', () => {
        const values = Array.from(new URL(buildPositionUrl()).searchParams.values());
        expect(values).toContain('ff-user'); // ASSERTION (frozen)
    });

    it('marks the timeline variant so the image reads "Predicted" with no Current PnL row', () => {
        const url = buildPositionUrl({ variant: 'timeline' });
        expect(url).toContain('timeline'); // ASSERTION (frozen)
        expect(buildPositionUrl()).not.toContain('timeline'); // ASSERTION (frozen)
    });

    it('builds the winnings image URL with all item titles, the total and the profile QR link', () => {
        const proxyAddress = `0x${'ab'.repeat(20)}`;
        const profileQrUrl = buildPolymarketProfileShareUrl(proxyAddress, 'uid-1');
        const url = buildPolymarketShareImageUrl({
            type: 'winnings',
            totalWon: 345.67,
            items: [
                { title: 'Winning market A', cost: 10, won: 25, pnlRate: 150 },
                { title: 'Winning market B', cost: 20, won: 30, pnlRate: 50 },
            ],
            identity: { displayName: 'ff-user' },
            qrUrl: profileQrUrl,
        });

        const parsed = new URL(url);
        expect(parsed.pathname.endsWith('/polymarket/share-image')).toBe(true); // ASSERTION (frozen)
        expect(url).toContain('winnings'); // ASSERTION (frozen)

        const decoded = decodeURIComponent(url);
        expect(decoded).toContain('Winning market A'); // ASSERTION (frozen)
        expect(decoded).toContain('Winning market B'); // ASSERTION (frozen)
        expect(decoded).toContain('345.67'); // ASSERTION (frozen)
        expect(Array.from(parsed.searchParams.values())).toContain(profileQrUrl); // ASSERTION (frozen)
    });
});
