import { runInSafe } from '@dimensiondev/utils';
import { formatAddress, isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { resolveWatchTypeToSource } from '@/helpers/resolveWatchTypeToSource.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

function shortAddress(address: string) {
    if (isValidAddressEthereum(address) || isValidAddressSolana(address)) {
        return formatAddress(address, 4);
    }

    return address;
}

export function resolveBetActivityTraderInfo(activity: BetsActivity): {
    displayName: string;
    avatarUrl: string;
    source?: Source;
} {
    const walletAddress = activity.proxyWallet || activity.wallet;
    const addressName = formatAddress(walletAddress, 4);
    const walletAvatarUrl = getStampAvatarByProfileId(Source.Wallet, walletAddress);

    if (activity.displayInfoV2?.name && activity.displayInfoV2.avatarUrl) {
        const platform = activity.displayInfoV2.platform;

        return {
            displayName: shortAddress(activity.displayInfoV2.name),
            avatarUrl: activity.displayInfoV2.avatarUrl,
            source: platform ? runInSafe(() => resolveSourceFromFireflyPlatform(platform)) : undefined,
        };
    }

    if (activity.displayInfo?.fireflyUid) {
        return {
            displayName: shortAddress(
                activity.displayInfo.fireflyName || activity.displayInfo.ensHandle || addressName,
            ),
            avatarUrl: activity.displayInfo.fireflyAvatarUrl || activity.displayInfo.avatarUrl || walletAvatarUrl,
            source: Source.Firefly,
        };
    }

    const followingSource = first(activity.followingSources);
    const followingName = followingSource?.name || followingSource?.handle;
    if (followingName) {
        const source = runInSafe(() => resolveWatchTypeToSource(followingSource.type));
        return {
            source,
            displayName: shortAddress(followingName),
            avatarUrl:
                source && followingSource.id ? getStampAvatarByProfileId(source, followingSource.id) : walletAvatarUrl,
        };
    }

    return {
        displayName: activity.displayInfo?.ensHandle || addressName,
        avatarUrl: walletAvatarUrl,
    };
}
