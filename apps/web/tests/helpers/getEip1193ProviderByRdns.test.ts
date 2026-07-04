// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
    type Eip1193Provider,
    getEip1193ProviderByRdns,
    METAMASK_RDNS,
    PHANTOM_RDNS,
} from '@/helpers/getEip1193ProviderByRdns.js';

interface Eip6963Detail {
    info: { uuid: string; name: string; icon?: string; rdns?: string };
    provider: Eip1193Provider;
}

interface FlagBag {
    isMetaMask?: boolean;
    isPhantom?: boolean;
    isBraveWallet?: boolean;
    isRabby?: boolean;
    isCoinbaseWallet?: boolean;
    providers?: Eip1193Provider[];
}

interface EvmWindow {
    ethereum?: (Eip1193Provider & FlagBag) | undefined;
    phantom?: { ethereum?: (Eip1193Provider & FlagBag) | undefined } | undefined;
}

/**
 * Install simulated wallets that respond to `eip6963:requestProvider` by
 * announcing themselves, the way real EVM extensions do. Returns a cleanup.
 */
function installAnnouncers(details: Eip6963Detail[]): () => void {
    const responder = () => {
        for (const detail of details) {
            window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }) as CustomEvent);
        }
    };
    window.addEventListener('eip6963:requestProvider', responder);
    return () => window.removeEventListener('eip6963:requestProvider', responder);
}

function setEthereum(value: (Eip1193Provider & FlagBag) | undefined) {
    (window as unknown as EvmWindow).ethereum = value;
}

function setPhantom(value: (Eip1193Provider & FlagBag) | undefined) {
    (window as unknown as EvmWindow).phantom = value ? { ethereum: value } : undefined;
}

describe('getEip1193ProviderByRdns', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        setEthereum(undefined);
        setPhantom(undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('EIP-6963 announcement path', () => {
        test('returns the provider whose info.rdns matches', async () => {
            const metamask: Eip1193Provider = { request: vi.fn() };
            const phantom: Eip1193Provider = { request: vi.fn() };
            const cleanup = installAnnouncers([
                { info: { uuid: 'a', name: 'MetaMask', rdns: METAMASK_RDNS }, provider: metamask },
                { info: { uuid: 'b', name: 'Phantom', rdns: PHANTOM_RDNS }, provider: phantom },
            ]);

            // The announcement fires synchronously when the function dispatches
            // eip6963:requestProvider, so the promise settles without timer advance.
            const result = await getEip1193ProviderByRdns(METAMASK_RDNS);
            expect(result).toBe(metamask);

            cleanup();
        });

        test('can resolve Phantom by rdns when both are announced', async () => {
            const metamask: Eip1193Provider = { request: vi.fn() };
            const phantom: Eip1193Provider = { request: vi.fn() };
            const cleanup = installAnnouncers([
                { info: { uuid: 'a', name: 'MetaMask', rdns: METAMASK_RDNS }, provider: metamask },
                { info: { uuid: 'b', name: 'Phantom', rdns: PHANTOM_RDNS }, provider: phantom },
            ]);

            const result = await getEip1193ProviderByRdns(PHANTOM_RDNS);
            expect(result).toBe(phantom);

            cleanup();
        });
    });

    describe('window.ethereum.providers[] fallback', () => {
        test('picks MetaMask and excludes wallets masquerading as MetaMask (Phantom/Brave/Rabby)', async () => {
            const realMetaMask: Eip1193Provider & FlagBag = { request: vi.fn(), isMetaMask: true };
            const phantomPretender: Eip1193Provider & FlagBag = {
                request: vi.fn(),
                isMetaMask: true,
                isPhantom: true,
            };
            const bravePretender: Eip1193Provider & FlagBag = {
                request: vi.fn(),
                isMetaMask: true,
                isBraveWallet: true,
            };
            setEthereum({
                request: vi.fn(),
                providers: [phantomPretender, bravePretender, realMetaMask],
            });

            const promise = getEip1193ProviderByRdns(METAMASK_RDNS);
            await vi.advanceTimersByTimeAsync(500);
            const result = await promise;
            expect(result).toBe(realMetaMask);
        });

        test('picks Phantom from the providers[] array', async () => {
            const phantom: Eip1193Provider & FlagBag = { request: vi.fn(), isPhantom: true };
            setEthereum({ request: vi.fn(), providers: [phantom] });

            const promise = getEip1193ProviderByRdns(PHANTOM_RDNS);
            await vi.advanceTimersByTimeAsync(500);
            const result = await promise;
            expect(result).toBe(phantom);
        });
    });

    describe('dedicated / bare window.ethereum fallback', () => {
        test('uses window.phantom.ethereum for Phantom', async () => {
            const phantom: Eip1193Provider & FlagBag = { request: vi.fn(), isPhantom: true };
            setPhantom(phantom);

            const promise = getEip1193ProviderByRdns(PHANTOM_RDNS);
            await vi.advanceTimersByTimeAsync(500);
            const result = await promise;
            expect(result).toBe(phantom);
        });

        test('uses bare window.ethereum only when isMetaMask matches', async () => {
            const metaMask: Eip1193Provider & FlagBag = { request: vi.fn(), isMetaMask: true };
            setEthereum(metaMask);

            const promise = getEip1193ProviderByRdns(METAMASK_RDNS);
            await vi.advanceTimersByTimeAsync(500);
            const result = await promise;
            expect(result).toBe(metaMask);
        });

        test('returns undefined when no matching provider exists', async () => {
            // window.ethereum exists but is NOT MetaMask and no providers[] array.
            setEthereum({ request: vi.fn() });

            const promise = getEip1193ProviderByRdns(METAMASK_RDNS);
            await vi.advanceTimersByTimeAsync(500);
            const result = await promise;
            expect(result).toBeUndefined();
        });
    });
});
