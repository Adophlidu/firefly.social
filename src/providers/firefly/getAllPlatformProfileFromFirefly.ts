import { isHex } from 'viem';

import { NetworkType, Source } from '@/constants/enum.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { resolveValue } from '@/helpers/resolveValue.js';
import { getAllRelatedProfileInfo } from '@/providers/firefly/getAllRelatedProfileInfo.js';
import { type FireflyIdentity } from '@/providers/types/Firefly.js';

export async function getAllPlatformProfileFromFirefly(
    identity: FireflyIdentity,
    isAuthRequired: boolean,
    forceHandle = false,
) {
    const queryKey = resolveValue(() => {
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
                switch (getAddressType(identity.id, false)) {
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
    });

    return getAllRelatedProfileInfo(
        {
            [`${queryKey}`]: identity.id,
        },
        isAuthRequired,
    );
}
