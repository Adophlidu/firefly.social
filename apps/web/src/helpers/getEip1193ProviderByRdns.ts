/**
 * Deterministically resolve an EIP-1193 provider for a specific wallet by its
 * EIP-6963 rdns (e.g. 'io.metamask').
 *
 * Why this exists (FW-7834): reading raw `window.ethereum` is NOT a reliable way
 * to address a specific wallet when more than one EVM extension is installed.
 * MetaMask and Phantom both inject `window.ethereum`; whichever loads last wins
 * the reference (commonly Phantom, which overwrites it). MetaMask is then only
 * reachable through its EIP-6963-announced provider. The previous bind code read
 * `window.ethereum` directly and silently signed with whichever wallet won the
 * injection race — which is why MetaMask binding failed on fresh Vercel origins
 * while Phantom binding worked, and why rotating the signing API never fixed it.
 *
 * EIP-6963 (Multi Injected Provider Discovery) is the wallet-agnostic standard
 * exactly for this: each extension announces `{ info: { rdns }, provider }` in
 * response to an `eip6963:requestProvider` event. We dispatch the request,
 * collect announcements, and pick the provider whose `info.rdns` matches.
 *
 * This is dependency-free (the EIP-6963 protocol is just window events); `mipd`
 * is only a transitive dep of wagmi here and is not directly importable from
 * apps/web.
 */

const REQUEST_EVENT = 'eip6963:requestProvider';
const ANNOUNCE_EVENT = 'eip6963:announceProvider';

/** How long to wait for late EIP-6963 announcements before giving up. */
const ANNOUNCE_TIMEOUT_MS = 300;

export const METAMASK_RDNS = 'io.metamask';
export const PHANTOM_RDNS = 'app.phantom';

export interface Eip1193Provider {
    request: (args: { method: string; params?: readonly unknown[] }) => Promise<unknown>;
}

interface Eip6963ProviderInfo {
    uuid: string;
    name: string;
    icon?: string;
    rdns?: string;
}

interface Eip6963ProviderDetail {
    info: Eip6963ProviderInfo;
    provider: Eip1193Provider;
}

type Eip6963AnnounceEvent = CustomEvent<Eip6963ProviderDetail>;

interface ProviderFlagBag {
    isMetaMask?: boolean;
    isPhantom?: boolean;
    isBraveWallet?: boolean;
    isRabby?: boolean;
    isCoinbaseWallet?: boolean;
    providers?: Eip1193Provider[];
}

// Standalone (not extending Window) so it does not clash with the global
// `window.ethereum` augmentation; we cast `window` to it at the call site.
interface EvmWindow {
    ethereum?: (Eip1193Provider & ProviderFlagBag) | undefined;
    phantom?: { ethereum?: (Eip1193Provider & ProviderFlagBag) | undefined } | undefined;
}

function asFlagged(provider: Eip1193Provider): Eip1193Provider & ProviderFlagBag {
    return provider as Eip1193Provider & ProviderFlagBag;
}

/** True only for a provider that identifies as MetaMask and NOT as a rival. */
function matchesMetaMask(provider: Eip1193Provider): boolean {
    const p = asFlagged(provider);
    return !!p.isMetaMask && !p.isPhantom && !p.isBraveWallet && !p.isRabby && !p.isCoinbaseWallet;
}

function matchesPhantom(provider: Eip1193Provider): boolean {
    return !!asFlagged(provider).isPhantom;
}

/**
 * Request EIP-6963 announcements and resolve as soon as one matches `rdns`,
 * or after `ANNOUNCE_TIMEOUT_MS` if none does. SSR-safe (no-op on the server).
 */
function announceProviderByRdns(rdns: string): Promise<Eip1193Provider | undefined> {
    if (typeof window === 'undefined') return Promise.resolve(undefined);

    return new Promise((resolve) => {
        let settled = false;
        const finish = (value: Eip1193Provider | undefined) => {
            if (settled) return;
            settled = true;
            window.removeEventListener(ANNOUNCE_EVENT, handler);
            resolve(value);
        };
        const handler = (event: Event) => {
            const detail = (event as Eip6963AnnounceEvent).detail;
            if (detail?.info?.rdns === rdns && detail.provider) finish(detail.provider);
        };

        window.addEventListener(ANNOUNCE_EVENT, handler);
        // Some wallets attach their announcer asynchronously after the page loads;
        // re-dispatch so late announcers reply within this request.
        window.dispatchEvent(new Event(REQUEST_EVENT));
        setTimeout(() => finish(undefined), ANNOUNCE_TIMEOUT_MS);
    });
}

/**
 * Resolve the EIP-1193 provider for `rdns`. Resolution order:
 *   1. EIP-6963 announcement whose `info.rdns === rdns` (the canonical path).
 *   2. The legacy `window.ethereum.providers[]` multi-injection array, filtered
 *      by the wallet's flag (and, for MetaMask, excluding wallets that masquerade
 *      as MetaMask — Phantom/Brave/Rabby/Coinbase all set isMetaMask too).
 *   3. `window.phantom.ethereum` for Phantom.
 *   4. Bare `window.ethereum`, ONLY when its own flag already identifies it as
 *      the requested wallet (so we never fall through to the wrong wallet).
 * Returns `undefined` when no matching provider can be found.
 */
export async function getEip1193ProviderByRdns(rdns: string): Promise<Eip1193Provider | undefined> {
    if (typeof window === 'undefined') return undefined;

    // 1. EIP-6963 canonical path.
    const announced = await announceProviderByRdns(rdns);
    if (announced) return announced;

    const w = window as unknown as EvmWindow;
    const ethereum = w.ethereum;

    // 2. Legacy multi-injection array. Only the two supported EVM wallets use
    //    flag-based matching here; arbitrary rdns falls through to step 4.
    if (Array.isArray(ethereum?.providers)) {
        const candidates = ethereum!.providers!;
        if (rdns === METAMASK_RDNS) {
            const match = candidates.find(matchesMetaMask);
            if (match) return match;
        } else if (rdns === PHANTOM_RDNS) {
            const match = candidates.find(matchesPhantom);
            if (match) return match;
        }
    }

    // 3. Phantom exposes a dedicated reference.
    if (rdns === PHANTOM_RDNS && w.phantom?.ethereum) return w.phantom.ethereum;

    // 4. Bare window.ethereum, only if it already self-identifies as the wallet.
    if (ethereum) {
        if (rdns === METAMASK_RDNS && matchesMetaMask(ethereum)) return ethereum;
        if (rdns === PHANTOM_RDNS && matchesPhantom(ethereum)) return ethereum;
    }

    return undefined;
}
