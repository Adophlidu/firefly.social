import { ExtraLikeType, Source } from '@dimensiondev/enums';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { LikeButtonUI } from '@/components/Actions/LikeButtonUI.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { type LikeTarget, useToggleLike } from '@/hooks/useToggleLike.js';

type LikeButtonProps = LikeTarget & {
    disabled?: boolean;
};

function resolveInitialLikeData({ type, data }: LikeTarget) {
    switch (type) {
        case Source.Article:
        case Source.DAOs:
        case ExtraLikeType.Tips:
        case Source.Prediction:
            return { isLiked: data.isLiked, likeCount: data.likeCount || 0 };
        case Source.Swap:
            return { isLiked: data.is_like, likeCount: data.like_count || 0 };
        default:
            safeUnreachable(type);
            return { isLiked: false, likeCount: 0 };
    }
}

export const LikeButton = memo<LikeButtonProps>(function LikeButton({ disabled = false, ...baseProps }) {
    const likeData = resolveInitialLikeData(baseProps);
    const isLiked = likeData.isLiked ?? false;

    const { mutateAsync, isPending } = useToggleLike(baseProps);

    const isDisabled = isPending || disabled;

    return (
        <ClickableArea
            className={classNames('hover:text-danger flex w-min cursor-pointer items-center', {
                'opacity-50': isDisabled,
            })}
            disabled={isDisabled}
        >
            <LikeButtonUI
                isLiked={isLiked}
                disabled={isDisabled}
                likeCount={likeData?.likeCount}
                className="hover:bg-danger/20 inline-flex h-7 items-center justify-center gap-1 rounded-full px-1.5 transition-colors"
                onToggle={() => mutateAsync(isLiked)}
            />
        </ClickableArea>
    );
});
