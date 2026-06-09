import { FireflyAuthClient } from '@dimensiondev/auth';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/wallet';
import { atom } from 'jotai';

import { store } from '@/store/index.js';

/**
 * Single client that maintains the freshest Firefly access token — JWT v3
 * refresh and rotation, legacy→v3 upgrade, and the native bridge — reading the
 * shared `firefly-state` session. The policy follows the JWT v3 rollout flag:
 * `auto` (upgrade + v3) when enabled, `legacy` (serve the legacy token) otherwise.
 */
export const fireflyAuthClient = new FireflyAuthClient({
    fireflyRootUrl: envs.external.NEXT_PUBLIC_FIREFLY_ROOT_URL,
    policy: envs.external.NEXT_PUBLIC_FIREFLY_JWT_V3 === STATUS.Enabled ? 'auto' : 'legacy',
    // `globalThis.process` guards the Vite client bundle (no `process` there); resolves the
    // secret only server-side, and the package drops the header when it is undefined.
    headers: { 'x-vercel-protection-bypass': globalThis.process?.env?.VERCEL_AUTOMATION_BYPASS_SECRET },
});

const accessTokenAtom = atom<string | null>(null);

/** Freshest Firefly access token, maintained by {@link fireflyAuthClient}; `null` when signed out. */
export const fireflySessionTokenAtom = atom((get) => get(accessTokenAtom));

// Mirror the client's freshest token into the atom so the existing synchronous
// consumers (auth headers, login gate) react to refresh/rotation/sign-out.
if (typeof window !== 'undefined') {
    const sync = (token: string | null) => store.set(accessTokenAtom, token);
    fireflyAuthClient.subscribe(sync);
    void fireflyAuthClient.getAccessToken().then(sync);
}
