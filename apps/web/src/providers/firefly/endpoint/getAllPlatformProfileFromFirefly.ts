import { NetworkType, Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { getAddressType } from '@dimensiondev/web3/utils';
import { isHex } from 'viem';

import { isAbnormalFarHandle, resolveFidFromAbnormalFarHandle } from '@/providers/farcaster/isAbnormalFarHandle.js';
import { getAllRelatedProfileInfo } from '@/providers/firefly/endpoint/getAllRelatedProfileInfo.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';

function getQueryKey(identity: FireflyIdentity, forceHandle: boolean) {
    switch (identity.source) {
        case Source.Lens:
            if (isHex(identity.id) && !forceHandle) return 'lensProfileId';
            return 'lensHandle';
        case Source.Farcaster:
            // ex: !1019423
            if (isAbnormalFarHandle(identity.id)) return 'fid';

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
        case Source.Prediction:
        case Source.Polymarket:
        case Source.WorldCup:
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
    const identityId =
        identity.source === Source.Farcaster
            ? resolveFidFromAbnormalFarHandle(identity.id) || identity.id
            : identity.id;

    return getAllRelatedProfileInfo(
        {
            [queryKey]: identityId,
        },
        isAuthRequired,
    );
}
