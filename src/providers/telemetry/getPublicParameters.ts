import { getAccount } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { bom } from '@/helpers/bom.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { getWalletAdapter } from '@/providers/solana/getWalletAdapter.js';
import { useDeveloperSettingsState } from '@/store/useDeveloperSettingsStore.js';
import {
    useBskyStateStore,
    useFarcasterStateStore,
    useFireflyStateStore,
    useLensStateStore,
    useTwitterStateStore,
} from '@/store/useProfileStore.js';
import { SolanaChainId } from '#masknet/web3-shared-solana';

export function getPublicParameters(eventId: string, previousEventId: string | null) {
    const evmAccount = runInSafe(() => getAccount(config));
    const solanaAdaptor = runInSafe(() => getWalletAdapter());

    const fireflySession = useFireflyStateStore.getState().currentProfileSession as FireflySession | null;
    const developmentAPI = useDeveloperSettingsState.getState().developmentAPI;

    return {
        // ga best practices
        user_id: fireflySession?.profileId, // numeric user id

        public_uuid: eventId,
        public_previous_uuid: previousEventId,

        public_ua: bom.navigator?.userAgent,
        public_href: bom.location?.href,

        // evm
        public_evm_address: evmAccount?.address,
        public_evm_chain_id: evmAccount?.chainId,
        public_evm_caip10:
            evmAccount?.address && evmAccount.chainId
                ? `ethereum:${evmAccount.chainId}:${evmAccount.address}`
                : undefined,

        // solana
        public_solana_chain_id: SolanaChainId.Mainnet,
        public_solana_address: solanaAdaptor?.publicKey?.toBase58(),
        public_solana_caip10: solanaAdaptor?.publicKey
            ? `solana:${SolanaChainId.Mainnet}:${solanaAdaptor.publicKey.toBase58()}`
            : undefined,

        // common
        public_account_id: fireflySession?.accountIdForEvent,
        public_use_development_api: developmentAPI,

        // firefly account id
        firefly_account_id: fireflySession?.accountIdForEvent,

        // safary social login
        twitter_username: useTwitterStateStore.getState().currentProfile?.handle,
        lens_handle: useLensStateStore.getState().currentProfile?.handle,
        farcaster_id: useFarcasterStateStore.getState().currentProfile?.profileId,
        bsky_id: useBskyStateStore.getState().currentProfile?.profileId,

        activity:
            bom.location?.pathname?.startsWith('/events') || bom.location?.pathname?.startsWith('/event/')
                ? bom.location.href
                : undefined,
    };
}
