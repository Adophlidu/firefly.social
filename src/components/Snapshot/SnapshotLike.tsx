import { memo, useCallback } from 'react';

import { LikeButton } from '@/components/Actions/LikeButton.js';
import { useToggleSnapshotLike } from '@/hooks/useToggleSnapshotLike.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';

interface SnapshotLikeProps {
    activity: SnapshotActivity;
}

export const SnapshotLike = memo<SnapshotLikeProps>(function SnapshotLike({ activity }) {
    const { mutate: toggleLike, isPending } = useToggleSnapshotLike();
    const isLiked = activity.isLiked;
    const likeCount = activity.likeCount;

    const handleLike = useCallback(() => {
        toggleLike({
            activity,
            isLiked,
            likeCount,
        });
    }, [toggleLike, activity, isLiked, likeCount]);

    return <LikeButton isLiked={isLiked} likeCount={likeCount} onClick={handleLike} isPending={isPending} />;
});
