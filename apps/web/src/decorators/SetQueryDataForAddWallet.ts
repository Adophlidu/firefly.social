import { FireflyPlatform, NetworkType, WalletSource } from '@dimensiondev/enums';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { refetchAllConnectionsUntil } from '@/helpers/refetchAllConnectionsUntil.js';
import type { FireflyWallet } from '@/providers/firefly/Wallet.js';
import type { BindWalletResponse, FireflyWalletConnection } from '@/providers/types/Firefly.js';
import type { ClassType } from '@/types/utility.js';

interface WalletsData {
    connected?: FireflyWalletConnection[];
    related?: FireflyWalletConnection[];
    evmConnections?: FireflyWalletConnection[];
    solanaConnections?: FireflyWalletConnection[];
}

const METHODS_BE_OVERRIDDEN = ['verifyAndBindWallet'] as const;

// Optimistically insert a just-bound wallet into the ['allConnections'] cache
// (connected + the per-chain array the settings/wallets list renders).
function updateWalletFromQueryData(data: BindWalletResponse['data']) {
    if (!data) return;
    queryClient.setQueriesData<WalletsData>(
        {
            queryKey: ['allConnections'],
        },
        (old) => {
            if (!old) return old;
            const existing = [
                ...(old.connected ?? []),
                ...(old.related ?? []),
                ...(old.evmConnections ?? []),
                ...(old.solanaConnections ?? []),
            ];
            if (existing.some((x) => isSameEthereumAddress(x.address, data.address))) return old;
            const entry: FireflyWalletConnection = {
                address: data.address,
                avatar: '',
                canReport: false,
                ens: Array.isArray(data.ens) ? data.ens : data.ens ? [data.ens] : [],
                platform: data.blockchain === NetworkType.Solana ? 'solana' : 'eth',
                provider: FireflyPlatform.Firefly,
                source: WalletSource.Firefly,
                sources: [],
                twitterId: '',
                identities: [],
                // WalletItem gates Disconnect on `'isDefault' in c && c.isConnected`.
                isDefault: false,
                isConnected: true,
            };
            return produce(old, (draft) => {
                draft.connected = [...(draft.connected ?? []), entry];
                if (data.blockchain === NetworkType.Solana) {
                    draft.solanaConnections = [...(draft.solanaConnections ?? []), entry];
                } else {
                    draft.evmConnections = [...(draft.evmConnections ?? []), entry];
                }
            });
        },
    );
    // The /v1/accountConnection read lags the bind write; poll until it reflects
    // the new wallet, leaving the optimistic entry visible meanwhile.
    void refetchAllConnectionsUntil((fresh) =>
        fresh.connected.some((c) => isSameEthereumAddress(c.address, data.address)),
    );
}

export function SetQueryDataForAddWallet() {
    return function decorator<T extends ClassType<FireflyWallet>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as FireflyWallet[K];

            Object.defineProperty(target.prototype, key, {
                value: async (signMessage: string, signature: string) => {
                    const m = method as (signMessage: string, signature: string) => ReturnType<FireflyWallet[K]>;
                    const result = await m.call(target.prototype, signMessage, signature);
                    updateWalletFromQueryData(result);
                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
