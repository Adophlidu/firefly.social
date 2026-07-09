import {
    buildDestinationUrl,
    canonicalize,
    computeHash,
    formatShortLink,
    parseLink,
    SHORT_LINK_HASH_PATTERN,
} from '@dimensiondev/short-link';
import { describe, expect, it } from 'vitest';

const LENS_ID = '75465786495708041024031980789350935549587309036456321130993194581442600477851';
const BSKY_URI = 'at%3A%2F%2Fdid%3Aplc%3Az72i7hdynmk6r22z27h6tvur%2Fapp.bsky.feed.post%2F3lbmyrgnzuk2g';

/**
 * GOLDEN VECTORS — frozen forever.
 *
 * The canonical string and the 10-char hash are a contract shared by every
 * client (web, server, native). If a change to @dimensiondev/short-link makes
 * any of these fail, the change breaks every short link already in the wild.
 * Do NOT update the expected values; fix the regression instead.
 */
const GOLDEN_VECTORS = [
    {
        link: `https://firefly.social/post/lens/${LENS_ID}`,
        canonical: `post:lens::${LENS_ID}`,
        hash: 'pXjGDMi4Tn',
    },
    {
        link: `https://firefly.social/post/lens/${LENS_ID}?sid=2296550846`,
        canonical: `post:lens:2296550846:${LENS_ID}`,
        hash: 'jBXQNDxHpn',
    },
    {
        link: 'https://firefly.social/post/farcaster/0x9a8bc31ae4d1b8b2a4d0d17a2d3f7ee94c2b0f11',
        canonical: 'post:farcaster::0x9a8bc31ae4d1b8b2a4d0d17a2d3f7ee94c2b0f11',
        hash: 'ZVmun3fj6y',
    },
    {
        link: 'https://firefly.social/post/twitter/1859216517077843968?sid=1000234567',
        canonical: 'post:twitter:1000234567:1859216517077843968',
        hash: 'pdWTbrGcUn',
    },
    {
        // percent-encoded id stays verbatim (never decoded)
        link: `https://firefly.social/post/bsky/${BSKY_URI}`,
        canonical: `post:bsky::${BSKY_URI}`,
        hash: 'BDd2u8IW0U',
    },
    {
        link: 'https://firefly.social/profile/farcaster/13432',
        canonical: 'profile:farcaster::13432',
        hash: 'sDsNnLQwBJ',
    },
    {
        link: 'https://firefly.social/profile/lens/lens%2Ffireflyapp?sid=2296550846',
        canonical: 'profile:lens:2296550846:lens%2Ffireflyapp',
        hash: 'FYZUsvEsue',
    },
];

describe('golden vectors', () => {
    it.each(GOLDEN_VECTORS)('$link', async ({ link, canonical, hash }) => {
        const identity = parseLink(link);
        expect(identity).not.toBeNull();
        expect(canonicalize(identity!)).toBe(canonical);
        await expect(computeHash(identity!)).resolves.toBe(hash);
        expect(hash).toMatch(SHORT_LINK_HASH_PATTERN);
    });
});

describe('parseLink', () => {
    it('extracts kind, source, id and sid', () => {
        expect(parseLink('https://firefly.social/post/lens/123?sid=456')).toEqual({
            kind: 'post',
            source: 'lens',
            id: '123',
            sid: '456',
        });
    });

    it('takes the id segment verbatim, whatever the platform format', () => {
        expect(parseLink('https://firefly.social/post/bsky/did:plc:z72i7hdynmk6r22z27h6tvur')).toEqual({
            kind: 'post',
            source: 'bsky',
            id: 'did:plc:z72i7hdynmk6r22z27h6tvur',
        });
    });

    it('omits sid when the param is absent or empty', () => {
        expect(parseLink('https://firefly.social/post/lens/123')).toEqual({ kind: 'post', source: 'lens', id: '123' });
        expect(parseLink('https://firefly.social/post/lens/123?sid=')).toEqual({
            kind: 'post',
            source: 'lens',
            id: '123',
        });
    });

    it('ignores query params other than sid', () => {
        expect(parseLink('https://firefly.social/post/lens/123?utm_source=x&sid=456&foo=bar')).toEqual({
            kind: 'post',
            source: 'lens',
            id: '123',
            sid: '456',
        });
    });

    it('rejects non-production hosts and protocols', () => {
        expect(parseLink('https://www.firefly.social/post/lens/123')).toBeNull();
        expect(parseLink('https://evil.example.com/post/lens/123')).toBeNull();
        expect(parseLink('http://firefly.social/post/lens/123')).toBeNull();
        expect(parseLink('https://firefly.social:8443/post/lens/123')).toBeNull();
        expect(parseLink('not a url')).toBeNull();
    });

    it('rejects paths that are not exactly /{post|profile}/{source}/{id}', () => {
        expect(parseLink('https://firefly.social/en/post/lens/123')).toBeNull();
        expect(parseLink('https://firefly.social/post/lens/123/')).toBeNull();
        expect(parseLink('https://firefly.social/post/lens/123/photos/0')).toBeNull();
        expect(parseLink('https://firefly.social/post/lens')).toBeNull();
        expect(parseLink('https://firefly.social/article/lens/123')).toBeNull();
        expect(parseLink('https://firefly.social/')).toBeNull();
    });

    it('rejects sources outside the whitelist', () => {
        expect(parseLink('https://firefly.social/post/firefly/123')).toBeNull();
        expect(parseLink('https://firefly.social/post/Lens/123')).toBeNull();
        expect(parseLink('https://firefly.social/profile/wallet/0xabc')).toBeNull();
    });

    it('rejects oversized ids', () => {
        expect(parseLink(`https://firefly.social/post/lens/${'9'.repeat(257)}`)).toBeNull();
    });

    it('rejects sids that are not pure digits starting with 1-9', () => {
        expect(parseLink('https://firefly.social/post/lens/123?sid=ff_marketing-01')).toBeNull();
        expect(parseLink('https://firefly.social/post/lens/123?sid=abc')).toBeNull();
        expect(parseLink('https://firefly.social/post/lens/123?sid=0123')).toBeNull();
        expect(parseLink('https://firefly.social/post/lens/123?sid=0')).toBeNull();
        expect(parseLink('https://firefly.social/post/lens/123?sid=12.5')).toBeNull();
        expect(parseLink(`https://firefly.social/post/lens/123?sid=${'1'.repeat(21)}`)).toBeNull();
    });
});

describe('canonicalize', () => {
    it('keeps sid-bearing ids distinct from sid-present identities', () => {
        // The id is unconstrained, so it sits last in a fixed 4-field form;
        // these two must never serialize to the same string.
        const sidInId = canonicalize({ kind: 'post', source: 'bsky', id: 'x:sid:12' });
        const realSid = canonicalize({ kind: 'post', source: 'bsky', id: 'x', sid: '12' });
        expect(sidInId).toBe('post:bsky::x:sid:12');
        expect(realSid).toBe('post:bsky:12:x');
        expect(sidInId).not.toBe(realSid);
    });
});

describe('computeHash', () => {
    it('is deterministic', async () => {
        const identity = { kind: 'post', source: 'lens', id: '123' } as const;
        await expect(computeHash(identity)).resolves.toBe(await computeHash(identity));
    });

    it('distinguishes sid-absent from sid-present identities', async () => {
        const withoutSid = await computeHash({ kind: 'post', source: 'lens', id: '123' });
        const withSid = await computeHash({ kind: 'post', source: 'lens', id: '123', sid: '456' });
        expect(withoutSid).not.toBe(withSid);
    });
});

describe('buildDestinationUrl', () => {
    it('round-trips every golden link', () => {
        for (const { link } of GOLDEN_VECTORS) {
            expect(buildDestinationUrl(parseLink(link)!)).toBe(link);
        }
    });

    it('drops query params other than sid', () => {
        const identity = parseLink('https://firefly.social/post/lens/123?utm_source=x&sid=456')!;
        expect(buildDestinationUrl(identity)).toBe('https://firefly.social/post/lens/123?sid=456');
    });
});

describe('formatShortLink', () => {
    it('formats the /i/ URL', () => {
        expect(formatShortLink('pXjGDMi4Tn')).toBe('https://firefly.social/i/pXjGDMi4Tn');
    });
});
