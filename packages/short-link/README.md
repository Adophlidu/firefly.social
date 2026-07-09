# @dimensiondev/short-link

Deterministic short-link identity parsing and hashing, shared by Firefly clients and servers. Design: [DimensionDev/firefly-social#9385](https://github.com/DimensionDev/firefly-social/issues/9385).

A short link `https://firefly.social/i/<hash>` is content-addressed: the 10-char base62 hash is a pure function of the destination's canonical identity, so the same profile/post (+ optional sharer `sid`) always yields the same short link, on any platform.

```ts
import {
    computeHash,
    formatShortLink,
    parseLink,
} from '@dimensiondev/short-link';

const identity = parseLink(
    'https://firefly.social/post/lens/754657…851?sid=2296550846',
);
// { kind: 'post', source: 'lens', id: '754657…851', sid: '2296550846' } — or null if not a
// production-host post/profile link.

const hash = await computeHash(identity); // 'jBXQNDxHpn' cspell:disable-line
formatShortLink(hash); // 'https://firefly.social/i/jBXQNDxHpn' cspell:disable-line
```

## The contract is frozen

The canonical serialization (fixed 4-field form `kind:source:sid:id`, empty sid slot when absent — e.g. `post:lens:2296550846:<id>` / `post:lens::<id>`) and the hash encoding (sha256 → big-endian BigInt → 10 least-significant base62 digits, alphabet `0-9A-Za-z`) can **never change** once any client ships — every deployed client must compute byte-identical hashes forever. Golden vectors pinning both live in `apps/web/tests/short-link.test.ts`; if a change makes them fail, fix the change, not the vectors.

## Constraints

- Zero dependencies; Web globals only (`crypto.subtle`, `TextEncoder`) — runs in browsers, Node ≥ 18, and the edge runtime. No `node:crypto`.
- Layer-1 workspace package: must not import sibling `@dimensiondev/*` packages; the source whitelist mirrors `SourceInURL` social slugs by value.
- Ids are taken verbatim from the URL path segment — platform formats vary, so there is no charset validation (length cap only), no slug/id resolution, no decoding. The id sits **last** in the canonical form because it is unconstrained; the earlier fields all have closed charsets, keeping the serialization unambiguous.
- `sid` is a numeric ff uid: pure digits, no leading zero.
