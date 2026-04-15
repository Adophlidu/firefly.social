import { isSameEthereumAddress } from '@dimensiondev/web3/utils';

import { getEnsNameFromDisplayInfo } from '@/helpers/getEnsNameFromDisplayInfo.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';
import { type FireflySnapshotActivity, WatchType } from '@/providers/types/Firefly.js';

export function formatSnapshotActivityFromFirefly(snapshot: FireflySnapshotActivity): SnapshotActivity {
    const authorId = snapshot.owner;

    return {
        author: {
            id: authorId,
            handle: getEnsNameFromDisplayInfo(snapshot, authorId) ?? '',
            avatar: snapshot.displayInfo.avatarUrl ?? '',
            isFollowing: snapshot.followingSources.some(
                (x) => x.type === WatchType.Wallet && isSameEthereumAddress(x.walletAddress, authorId),
            ),
            isMuted: false,
        },
        isLiked: snapshot.is_like,
        likeCount: snapshot.like_count,
        owner: authorId,
        choice: snapshot.metadata.choice,
        type: snapshot.type,
        id: snapshot.id,
        timestamp: Number.parseInt(snapshot.timestamp, 10) * 1000,
        hash: snapshot.hash,
        related_urls: snapshot.related_urls,
        proposal_id: snapshot.metadata.proposal_id,
        hasBookmarked: snapshot.has_bookmarked,
        fallback_content: {
            title: snapshot.metadata.proposal_title,
            body: snapshot.metadata.proposal_body,
        },
        displayInfo: snapshot.displayInfo,
    };
}
