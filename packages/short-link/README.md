# @dimensiondev/short-link

Short-link identity parsing, shared by Firefly clients and servers. Design: [DimensionDev/firefly-social#9385](https://github.com/DimensionDev/firefly-social/issues/9385).

The short code (`https://firefly.social/i/<code>`) is assigned by the backend (`POST /v1/shortlinks` in Mask-X-Backend) when a link is registered — this package doesn't compute or format it. It only recognizes which Firefly URLs are share-linkable and rebuilds their canonical destination URL before it's sent to the backend for registration.

```ts
import {
    buildDestinationUrl,
    parseLink,
} from '@dimensiondev/short-link';

const identity = parseLink(
    'https://firefly.social/post/lens/754657…851?sid=2296550846',
);
// { kind: 'post', source: 'lens', id: '754657…851', sid: '2296550846' } — or null if not a
// production-host post/profile/... link.

buildDestinationUrl(identity); // 'https://firefly.social/post/lens/754657…851?sid=2296550846'
```

## Constraints

- Zero dependencies; Web globals only (`URL`/`URLSearchParams`) — runs in browsers, Node, and the edge runtime.
- Layer-1 workspace package: must not import sibling `@dimensiondev/*` packages; the source whitelist mirrors `SourceInURL` social slugs by value.
- Ids are taken verbatim from the URL path segment — platform formats vary, so there is no charset validation (length cap only), no slug/id resolution, no decoding.
- `sid` is a numeric ff uid: pure digits, no leading zero.
