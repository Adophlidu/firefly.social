import { isHex } from 'viem';

import { NetworkType, Source } from '@/constants/enum.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getAllRelatedProfileInfo } from '@/providers/firefly/endpoints/getAllRelatedProfileInfo.js';
import { type FireflyIdentity } from '@/providers/types/Firefly.js';

function getQueryKey(identity: FireflyIdentity, forceHandle: boolean) {
    switch (identity.source) {
        case Source.Lens:
            if (isHex(identity.id) && !forceHandle) return 'lensProfileId';
            return 'lensHandle';
        case Source.Farcaster:
            return forceHandle ? 'farcasterUsername' : 'fid';
        case Source.Twitter:
            return /^\d+$/.test(identity.id) && !forceHandle ? 'twitterId' : 'twitterHandle';
        case Source.Wallet:
        case Source.WalletMix:
            const addressType = getAddressType(identity.id, false);
            switch (addressType) {
                case NetworkType.Ethereum:
                    return 'walletAddress';
                case NetworkType.Solana:
                    return 'solanaAddress';
                default:
                    return 'walletAddress';
            }
        case Source.Bsky:
            if (identity.id.startsWith('did:plc:')) return 'bskyDid';
            return 'bskyHandle';
        case Source.Firefly:
            return 'uid';
        default:
            return '';
    }
}

export async function getAllPlatformProfileFromFirefly(
    identity: FireflyIdentity,
    isAuthRequired: boolean,
    forceHandle = false,
) {
    const queryKey = getQueryKey(identity, forceHandle);
    return getAllRelatedProfileInfo(
        {
            [queryKey]: identity.id,
        },
        isAuthRequired,
    );
}
