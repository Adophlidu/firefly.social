# @dimensiondev/auth

Firefly session access-token provider for sub-sites hosted under `firefly.social/*`
(e.g. `firefly.social/chat`).

Every sub-site shares the same origin and therefore the same `localStorage`, where
the Firefly app persists the signed-in session (`firefly-state`). This package reads
that session, **maintains JWT v3 token rotation by itself**, and exposes only the
freshest access token to consumers — so each sub-site never has to reimplement
refresh, cross-tab coordination, or the native bridge.

## Install

```sh
pnpm add @dimensiondev/auth
```

The package is published to GitHub Packages. Ensure your `.npmrc` has:

```
@dimensiondev:registry=https://npm.pkg.github.com/
```

## Usage

Create one `FireflyAuthClient` and share it across your app:

```ts
import { FireflyAuthClient } from '@dimensiondev/auth';

// Production defaults baked in; pass options to override (see Configuration).
export const auth = new FireflyAuthClient();

// Freshest valid token (refreshes proactively if near expiry); null if signed out.
const token = await auth.getAccessToken();

// React to login/logout/rotation across tabs.
const unsubscribe = auth.subscribe((token) => {
    console.log('access token changed:', token);
});

// After a request fails with 401, force a refresh and retry.
async function fetchWithAuth(
    url: string,
    init?: RequestInit,
) {
    let token = await auth.getAccessToken();
    const res = await fetch(url, withAuth(init, token));
    if (res.status !== 401) return res;
    token = await auth.refresh();
    return fetch(url, withAuth(init, token));
}
```

### React

Pass your shared client instance to the hook:

```tsx
import { useFireflyAccessToken } from '@dimensiondev/auth/react';

import { auth } from './auth.js';

function Profile() {
    const token = useFireflyAccessToken(auth);
    // ...
}
```

## Configuration

Sensible production defaults are baked in; override per environment by passing
options to the constructor:

```ts
const auth = new FireflyAuthClient({
    mode: 'native', // 'auto' | 'web' | 'native'; default: 'auto' (detect the host)
    fireflyRootUrl: 'https://api-dev.firefly.land', // default: https://api.firefly.land
    accessTokenTtlMs: 15 * 60 * 1000, // default: 15m
    proactiveRefreshThresholdMs: 10 * 60 * 1000, // default: 10m
    storageKey: 'firefly-state', // default
    storage: localStorage, // default: ambient localStorage; supply any { getItem, setItem }
    debug: false,
});
```

Pass `storage: null` to disable web storage entirely (native-only contexts).

## How it works

- **Web**: the configured storage (default `localStorage`) is the source of truth.
  Tokens are refreshed before expiry via `POST /v3/auth/refreshJWT`, rotated under
  an origin-wide [Web Lock](https://developer.mozilla.org/docs/Web/API/Web_Locks_API)
  (`firefly:jwt:token`) so concurrent tabs/sub-sites don't burn the single-use
  refresh token, and written back so siblings adopt the rotated pair. Legacy-only
  sessions are upgraded via `exchangeLegacyJWT` on first use.
- **Native** (inside the Firefly app webview): on builds that support
  `GET_REFRESH_TOKEN`, the refresh token is obtained from the native bridge and
  this package maintains rotation in memory (a 401 re-seeds from the bridge once).
  On older builds that lack `GET_REFRESH_TOKEN` (detected via
  `GET_SUPPORTED_METHODS`), the host app owns token freshness, so the package
  simply pulls the current access token via `GET_AUTHORIZATION` when ours nears
  expiry.

Either way, consumers only ever see the newest access token.
