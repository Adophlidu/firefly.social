import { resolveValue, safeUnreachable } from '@dimensiondev/utils';
import { isHex } from 'viem';

import { NetworkType, Source } from '@/constants/enum.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export async function getAllPlatformProfileFromFirefly(identity: FireflyIdentity, forceHandle = false) {
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
            case Source.WalletMix: {
                const addrType = getAddressType(identity.id, false);
                if (!addrType) return 'walletAddress';

                switch (addrType) {
                    case NetworkType.Ethereum:
                        return 'walletAddress';
                    case NetworkType.Solana:
                        return 'solanaAddress';
                    default:
                        safeUnreachable(addrType);
                        return 'walletAddress';
                }
            }
            case Source.Bsky:
                if (identity.id.startsWith('did:plc:')) return 'bskyDid';
                return 'bskyHandle';
            case Source.Firefly:
                return 'uid';
            case Source.Article:
            case Source.NFTs:
            case Source.Tokens:
            case Source.Polymarket:
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
                // These sources don't have profile lookup support
                return '';
            default:
                safeUnreachable(identity.source);
                return '';
        }
    });

    return getFireflyEndpoint().getWalletProfileInfo({
        [`${queryKey}`]: identity.id,
    });
}
