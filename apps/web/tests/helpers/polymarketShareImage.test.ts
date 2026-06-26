import { describe, expect, it } from 'vitest';

import {
    buildPolymarketEventShareUrl,
    buildPolymarketProfileShareUrl,
    computeTimelinePnlRate,
    formatSharePnlHeadline,
    resolvePolymarketShareIdentity,
    resolvePredictedSide,
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

describe('resolvePredictedSide (FW-7823 — sports share-image predicted badge)', () => {
    // Panama (home) vs Croatia (away) — the matchup from the reported bug.
    const home = { name: 'Panama', abbreviation: 'PAN' };
    const away = { name: 'Croatia', abbreviation: 'CRO' };

    it('maps a moneyline outcome that IS a team name to that team', () => {
        expect(
            resolvePredictedSide({
                home,
                away,
                outcome: 'Croatia',
                title: 'Panama vs. Croatia',
                isDraw: false,
                outcomeIndex: 1,
            }),
        ).toBe('away');
        expect(
            resolvePredictedSide({
                home,
                away,
                outcome: 'Panama',
                title: 'Panama vs. Croatia',
                isDraw: false,
                outcomeIndex: 0,
            }),
        ).toBe('home');
    });

    it('matches a team by alias too', () => {
        const bosnia = { name: 'Bosnia and Herzegovina', alias: 'Bosnia-Herzegovina' };
        expect(
            resolvePredictedSide({
                home: bosnia,
                away,
                outcome: 'Bosnia-Herzegovina',
                title: '',
                isDraw: false,
                outcomeIndex: 1,
            }),
        ).toBe('home');
    });

    it('resolves an explicit Draw pick on a draw market', () => {
        expect(
            resolvePredictedSide({
                home,
                away,
                outcome: 'Draw',
                title: 'Panama vs. Croatia',
                isDraw: true,
                outcomeIndex: 1,
            }),
        ).toBe('draw');
    });

    it('uses the binary title subject for "Yes" — NOT the outcomeIndex (the reported bug)', () => {
        // "Will Croatia win?" + outcome "Yes" (outcomeIndex 0) must resolve to Croatia (away), not Panama.
        expect(
            resolvePredictedSide({
                home,
                away,
                outcome: 'Yes',
                title: 'Will Croatia win on 2026-06-23?',
                isDraw: false,
                outcomeIndex: 0,
            }),
        ).toBe('away');
    });

    it('shows the binary title subject for "No" too (badge = the title team regardless of side)', () => {
        expect(
            resolvePredictedSide({
                home,
                away,
                outcome: 'No',
                title: 'Will Croatia win on 2026-06-23?',
                isDraw: false,
                outcomeIndex: 1,
            }),
        ).toBe('away');
    });

    it('picks the team mentioned first when the title names both', () => {
        expect(
            resolvePredictedSide({
                home,
                away,
                outcome: 'Yes',
                title: 'Will Croatia beat Panama?',
                isDraw: false,
                outcomeIndex: 0,
            }),
        ).toBe('away');
    });

    it('falls back to the outcomeIndex mapping when neither outcome nor title names a team', () => {
        expect(
            resolvePredictedSide({
                home,
                away,
                outcome: 'Yes',
                title: 'Will the favorite win?',
                isDraw: false,
                outcomeIndex: 1,
            }),
        ).toBe('away');
        expect(
            resolvePredictedSide({
                home,
                away,
                outcome: 'Yes',
                title: 'Will the favorite win?',
                isDraw: false,
                outcomeIndex: 0,
            }),
        ).toBe('home');
    });

    it('uses outcomeIndex (not the title) for a non-Yes/No label that fails the exact team match', () => {
        // A moneyline label formatted differently from the event-detail team name ('Croatia FC' vs
        // 'Croatia') fails matchesTeamLabel. The title names BOTH teams, so a title guess would be wrong;
        // resolution must defer to the more reliable outcomeIndex instead.
        expect(
            resolvePredictedSide({
                home,
                away,
                outcome: 'Croatia FC',
                title: 'Panama vs. Croatia',
                isDraw: false,
                outcomeIndex: 1,
            }),
        ).toBe('away');
        expect(
            resolvePredictedSide({
                home,
                away,
                outcome: 'Croatia FC',
                title: 'Panama vs. Croatia',
                isDraw: false,
                outcomeIndex: 0,
            }),
        ).toBe('home');
    });

    it('matches team names on word boundaries, not as substrings', () => {
        // 'Iran' must not match inside 'Iranian'; with no real mention, resolution defers to outcomeIndex.
        const iran = { name: 'Iran' };
        const qatar = { name: 'Qatar' };
        expect(
            resolvePredictedSide({
                home: iran,
                away: qatar,
                outcome: 'Yes',
                title: 'Will Iranian side win?',
                isDraw: false,
                outcomeIndex: 1,
            }),
        ).toBe('away');
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

    it('builds the wallet profile link with the sharer uid', () => {
        const proxyAddress = `0x${'ab'.repeat(20)}`;
        expect(buildPolymarketProfileShareUrl(proxyAddress, 'uid-1')).toBe(
            `https://firefly.social/polymarket/profile/${proxyAddress}?sid=uid-1`,
        ); // ASSERTION (frozen)
    });
});
