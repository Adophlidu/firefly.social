import { first } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveWatchTypeToSource } from '@/helpers/resolveWatchTypeToSource.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

export function resolveBetActivityTraderInfo(activity: BetsActivity): {
    displayName: string;
    avatarUrl: string;
    source?: Source;
} {
    const walletAddress = activity.proxyWallet || activity.wallet;
    const addressName = formatAddress(walletAddress, 4);
    const walletAvatarUrl = getStampAvatarByProfileId(Source.Wallet, walletAddress);

    if (activity.displayInfo?.fireflyUid) {
        return {
            displayName: activity.displayInfo.fireflyName || activity.displayInfo.ensHandle || addressName,
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
            displayName: followingName,
            avatarUrl:
                source && followingSource.id ? getStampAvatarByProfileId(source, followingSource.id) : walletAvatarUrl,
        };
    }

    return {
        displayName: activity.displayInfo?.ensHandle || addressName,
        avatarUrl: walletAvatarUrl,
    };
}
