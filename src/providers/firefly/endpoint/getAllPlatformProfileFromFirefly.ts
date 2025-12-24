import { safeUnreachable } from '@dimensiondev/utils';
import { isHex } from 'viem';

import { NetworkType, Source } from '@/constants/enum.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getAllRelatedProfileInfo } from '@/providers/firefly/endpoint/getAllRelatedProfileInfo.js';
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
            if (!addressType) return 'walletAddress';

            switch (addressType) {
                case NetworkType.Ethereum:
                    return 'walletAddress';
                case NetworkType.Solana:
                    return 'solanaAddress';
                default:
                    safeUnreachable(addressType);
                    return 'walletAddress';
            }
        case Source.Bsky:
            if (identity.id.startsWith('did:plc:')) return 'bskyDid';
            return 'bskyHandle';
        case Source.Firefly:
            return 'uid';
        case Source.Article:
        case Source.NFTs:
        case Source.Tokens:
        case Source.Telegram:
        case Source.Google:
        case Source.Apple:
        case Source.Email:
        case Source.DAOs:
        case Source.Posts:
        case Source.Notifications:
        case Source.Swap:
        case Source.Transactions:
        case Source.Activities:
        case Source.X3Pro:
        case Source.Bets:
            return '';
        default:
            safeUnreachable(identity.source);
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
