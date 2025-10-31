import { bom } from '@firefly/utils';
import { getAccount } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { Source } from '@/constants/enum.js';
import { getProfileFromStorage } from '@/helpers/getProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { getWalletAdapter } from '@/providers/solana/getWalletAdapter.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { useDeveloperSettingsState } from '@/store/useDeveloperSettingsStore.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function getPublicParameters(eventId: string, previousEventId: string | null) {
    const evmAccount = runInSafe(() => getAccount(wagmiConfig));
    const solanaAdaptor = runInSafe(() => getWalletAdapter());

    const fireflySession = getSessionFromStorage(SessionType.Firefly);

    const lensProfile = getProfileFromStorage(Source.Lens);
    const farcasterProfile = getProfileFromStorage(Source.Farcaster);
    const xProfile = getProfileFromStorage(Source.Twitter);
    const bskyProfile = getProfileFromStorage(Source.Bsky);

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

        // firefly session
        public_account_id: fireflySession?.accountIdForEvent,
        public_use_development_api: developmentAPI,

        // vercel region
        public_ip_timezone: bom.window?.VERCEL_IP_TIMEZONE,
        public_ip_city: bom.window?.VERCEL_IP_CITY,
        public_ip_country: bom.window?.VERCEL_IP_COUNTRY,
        public_ip_region: bom.window?.VERCEL_IP_REGION,

        // firefly account id
        firefly_account_id: fireflySession?.accountIdForEvent,

        // social login parameters
        twitter_username: xProfile?.handle,
        lens_handle: lensProfile?.handle,
        farcaster_id: farcasterProfile?.profileId,
        bsky_id: bskyProfile?.profileId,

        activity:
            bom.location?.pathname?.startsWith('/events') || bom.location?.pathname?.startsWith('/event/')
                ? bom.location.href
                : undefined,
    };
}
