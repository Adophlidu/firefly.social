import { buildDestinationUrl, parseLink } from '@dimensiondev/short-link';
import { describe, expect, it } from 'vitest';

const LENS_ID = '75465786495708041024031980789350935549587309036456321130993194581442600477851';
const BSKY_URI = 'at%3A%2F%2Fdid%3Aplc%3Az72i7hdynmk6r22z27h6tvur%2Fapp.bsky.feed.post%2F3lbmyrgnzuk2g';

/** One link per supported kind/shape, used to exercise parseLink <-> buildDestinationUrl round-tripping. */
const LINKS = [
    `https://firefly.social/post/lens/${LENS_ID}`,
    `https://firefly.social/post/lens/${LENS_ID}?sid=2296550846`,
    'https://firefly.social/post/farcaster/0x9a8bc31ae4d1b8b2a4d0d17a2d3f7ee94c2b0f11',
    'https://firefly.social/post/twitter/1859216517077843968?sid=1000234567',
    // resolveSourceInUrl() emits 'x' (not 'twitter') for Source.Twitter — both must parse.
    'https://firefly.social/post/x/1859216517077843968?sid=1000234567',
    // percent-encoded id stays verbatim (never decoded)
    `https://firefly.social/post/bsky/${BSKY_URI}`,
    'https://firefly.social/profile/farcaster/13432',
    'https://firefly.social/profile/x/1859216517077843968',
    'https://firefly.social/profile/lens/lens%2Ffireflyapp?sid=2296550846',
    'https://firefly.social/article/9f8c1e2d-1234-4a5b-8c3d-abcdef123456',
    'https://firefly.social/tx/1/0x9a8bc31ae4d1b8b2a4d0d17a2d3f7ee94c2b0f11deadbeefdeadbeefdeadbeef',
    'https://firefly.social/polymarket/event/123456?sid=2296550846',
    'https://firefly.social/polymarket/event/123456?type=multi',
    'https://firefly.social/club/farcaster/123',
    'https://firefly.social/club/lens/456?sid=2296550846',
    'https://firefly.social/token/cex/mask-network',
    'https://firefly.social/token/dex/56/0xda7ad9dea9397cffddae2f8a052b82f1484252b3',
    'https://firefly.social/polymarket/profile/0x45d6fcdefd1188d3c3028eb649b6ad0f2981da4c',
    'https://firefly.social/opinion/profile/0xabc123?sid=1000234567',
    'https://firefly.social/tx/9745/0xc14631ce48904392bbf2f85b5b7fec5cbdcca64577d7c93729d81207e88f1f50',
    'https://firefly.social/tx/9745/0xc14631ce48904392bbf2f85b5b7fec5cbdcca64577d7c93729d81207e88f1f50?view=receiver',
    'https://firefly.social/tx/9745/0xc14631ce48904392bbf2f85b5b7fec5cbdcca64577d7c93729d81207e88f1f50?view=sender',
];

describe('parseLink', () => {
    it('recognizes every supported link shape', () => {
        for (const link of LINKS) {
            expect(parseLink(link), link).not.toBeNull();
        }
    });

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

    it('accepts firefly.social and the allowlisted deployment subdomains', () => {
        for (const host of [
            'firefly.social',
            'canary.firefly.social',
            'staging.firefly.social',
            'alpha.firefly.social',
            'beta.firefly.social',
        ]) {
            expect(parseLink(`https://${host}/post/lens/123`), host).toEqual({
                kind: 'post',
                source: 'lens',
                id: '123',
            });
        }

        expect(parseLink('https://canary.firefly.social/post/lens/123?sid=456')).toEqual({
            kind: 'post',
            source: 'lens',
            id: '123',
            sid: '456',
        });
    });

    it('rejects hosts outside the explicit allowlist — no open *.firefly.social wildcard', () => {
        expect(parseLink('https://evil.example.com/post/lens/123')).toBeNull();
        expect(parseLink('https://evilfirefly.social/post/lens/123')).toBeNull();
        expect(parseLink('https://firefly.social.evil.com/post/lens/123')).toBeNull();
        // Not on the allowlist, even though it's a real firefly.social subdomain.
        expect(parseLink('https://www.firefly.social/post/lens/123')).toBeNull();
        expect(parseLink('https://preview-123.firefly.social/post/lens/123')).toBeNull();
    });

    it('rejects http and non-default ports even on allowlisted hosts', () => {
        expect(parseLink('http://firefly.social/post/lens/123')).toBeNull();
        expect(parseLink('http://staging.firefly.social/post/lens/123')).toBeNull();
        expect(parseLink('https://firefly.social:8443/post/lens/123')).toBeNull();
        expect(parseLink('https://staging.firefly.social:8443/post/lens/123')).toBeNull();
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

    it('accepts both twitter and x as the Twitter/X source segment — resolveSourceInUrl() emits x', () => {
        expect(parseLink('https://firefly.social/post/x/123')).toEqual({ kind: 'post', source: 'x', id: '123' });
        expect(parseLink('https://firefly.social/profile/x/123')).toEqual({
            kind: 'profile',
            source: 'x',
            id: '123',
        });
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

    it('parses /article/:id with no source', () => {
        expect(parseLink('https://firefly.social/article/abc-123')).toEqual({
            kind: 'article',
            source: '',
            id: 'abc-123',
        });
    });

    it('rejects malformed article paths', () => {
        expect(parseLink('https://firefly.social/article')).toBeNull();
        expect(parseLink('https://firefly.social/article/')).toBeNull();
        expect(parseLink('https://firefly.social/article/abc/extra')).toBeNull();
    });

    it('parses /tx/:chainId/:hash as swap, source = chain id', () => {
        expect(parseLink('https://firefly.social/tx/1/0xabc')).toEqual({
            kind: 'swap',
            source: '1',
            id: '0xabc',
        });
    });

    it('rejects swap chain ids that are not pure digits starting with 1-9', () => {
        expect(parseLink('https://firefly.social/tx/0x1/0xabc')).toBeNull();
        expect(parseLink('https://firefly.social/tx/01/0xabc')).toBeNull();
        expect(parseLink('https://firefly.social/tx/0/0xabc')).toBeNull();
        expect(parseLink('https://firefly.social/tx//0xabc')).toBeNull();
    });

    it('parses /:platform/event/:id as prediction for every known platform', () => {
        expect(parseLink('https://firefly.social/polymarket/event/123')).toEqual({
            kind: 'prediction',
            source: 'polymarket',
            id: '123',
        });
        expect(parseLink('https://firefly.social/opinion/event/123')).toEqual({
            kind: 'prediction',
            source: 'opinion',
            id: '123',
        });
    });

    it('rejects prediction links with an unknown platform', () => {
        expect(parseLink('https://firefly.social/kalshi/event/123')).toBeNull();
        expect(parseLink('https://firefly.social/post/event/123')).toBeNull();
    });

    it('sets multi only when ?type=multi is present on a prediction link', () => {
        expect(parseLink('https://firefly.social/polymarket/event/123?type=multi')).toEqual({
            kind: 'prediction',
            source: 'polymarket',
            id: '123',
            multi: true,
        });
        expect(parseLink('https://firefly.social/polymarket/event/123?type=single')).toEqual({
            kind: 'prediction',
            source: 'polymarket',
            id: '123',
        });
        // ?type is only meaningful on prediction links.
        expect(parseLink('https://firefly.social/post/lens/123?type=multi')).toEqual({
            kind: 'post',
            source: 'lens',
            id: '123',
        });
    });

    it('parses /club/:source/:id for lens/farcaster/bsky, narrower than post/profile sources', () => {
        expect(parseLink('https://firefly.social/club/farcaster/123')).toEqual({
            kind: 'club',
            source: 'farcaster',
            id: '123',
        });
        expect(parseLink('https://firefly.social/club/lens/123')).toEqual({ kind: 'club', source: 'lens', id: '123' });
        expect(parseLink('https://firefly.social/club/bsky/123')).toEqual({ kind: 'club', source: 'bsky', id: '123' });
    });

    it('rejects club links on twitter/x — clubs only exist on lens/farcaster/bsky', () => {
        expect(parseLink('https://firefly.social/club/twitter/123')).toBeNull();
        expect(parseLink('https://firefly.social/club/x/123')).toBeNull();
    });

    it('parses /token/cex/:id and /token/dex/:chainId/:address', () => {
        expect(parseLink('https://firefly.social/token/cex/mask-network')).toEqual({
            kind: 'token',
            source: 'cex',
            id: 'mask-network',
        });
        expect(parseLink('https://firefly.social/token/dex/56/0xabc')).toEqual({
            kind: 'token',
            source: 'dex',
            id: '0xabc',
            chainId: '56',
        });
    });

    it('rejects malformed token paths', () => {
        expect(parseLink('https://firefly.social/token/cex')).toBeNull();
        expect(parseLink('https://firefly.social/token/dex/56')).toBeNull();
        expect(parseLink('https://firefly.social/token/dex/0x1/0xabc')).toBeNull();
        expect(parseLink('https://firefly.social/token/futures/56/0xabc')).toBeNull();
    });

    it('parses /:platform/profile/:address as predictionProfile for every known platform', () => {
        expect(parseLink('https://firefly.social/polymarket/profile/0xabc')).toEqual({
            kind: 'predictionProfile',
            source: 'polymarket',
            id: '0xabc',
        });
        expect(parseLink('https://firefly.social/opinion/profile/0xabc')).toEqual({
            kind: 'predictionProfile',
            source: 'opinion',
            id: '0xabc',
        });
    });

    it('rejects predictionProfile links with an unknown platform', () => {
        expect(parseLink('https://firefly.social/kalshi/profile/0xabc')).toBeNull();
        expect(parseLink('https://firefly.social/profile/profile/0xabc')).toBeNull();
    });

    it('sets view only when ?view=sender|receiver is present on a swap link', () => {
        expect(parseLink('https://firefly.social/tx/1/0xabc?view=receiver')).toEqual({
            kind: 'swap',
            source: '1',
            id: '0xabc',
            view: 'receiver',
        });
        expect(parseLink('https://firefly.social/tx/1/0xabc?view=sender')).toEqual({
            kind: 'swap',
            source: '1',
            id: '0xabc',
            view: 'sender',
        });
        expect(parseLink('https://firefly.social/tx/1/0xabc?view=bogus')).toEqual({
            kind: 'swap',
            source: '1',
            id: '0xabc',
        });
        // ?view is only meaningful on swap links.
        expect(parseLink('https://firefly.social/post/lens/123?view=receiver')).toEqual({
            kind: 'post',
            source: 'lens',
            id: '123',
        });
    });
});

describe('buildDestinationUrl', () => {
    it('round-trips every supported link shape', () => {
        for (const link of LINKS) {
            expect(buildDestinationUrl(parseLink(link)!)).toBe(link);
        }
    });

    it('drops query params other than sid', () => {
        const identity = parseLink('https://firefly.social/post/lens/123?utm_source=x&sid=456')!;
        expect(buildDestinationUrl(identity)).toBe('https://firefly.social/post/lens/123?sid=456');
    });
});
