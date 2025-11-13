import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { memo } from 'react';

import LikeIcon from '@/assets/like.svg';
import LikedIcon from '@/assets/liked.svg';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Tooltip } from '@/components/Tooltip.js';
import { Source } from '@/constants/enum.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { type LikeTarget, useToggleLike } from '@/hooks/useToggleLike.js';

type LikeButtonProps = LikeTarget & {
    disabled?: boolean;
};

function resolveInitialLikeData({ type, data }: LikeTarget) {
    switch (type) {
        case Source.Article:
        case Source.DAOs:
        case Source.Polymarket:
            return { isLiked: data.isLiked, likeCount: data.likeCount || 0 };
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
            className={classNames('flex w-min cursor-pointer items-center hover:text-danger', {
                'opacity-50': isDisabled,
            })}
            disabled={isDisabled}
            onClick={() => mutateAsync(isLiked)}
        >
            <Tooltip
                content={isLiked ? <Trans>Unlike</Trans> : <Trans>Like</Trans>}
                placement="top"
                disabled={isDisabled}
            >
                <motion.button
                    disabled={isDisabled}
                    whileTap={{ scale: 0.9 }}
                    className="inline-flex h-7 items-center justify-center gap-1 rounded-full px-1.5 transition-colors hover:bg-danger/20"
                >
                    {isPending ? (
                        <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <>
                            {isLiked ? <LikedIcon width={16} height={16} /> : <LikeIcon width={16} height={16} />}
                            {likeData?.likeCount > 0 && (
                                <span
                                    className={classNames('text-xs font-bold', {
                                        'text-danger': isLiked,
                                        'text-second': !isLiked,
                                    })}
                                >
                                    {nFormatter(likeData.likeCount)}
                                </span>
                            )}
                        </>
                    )}
                </motion.button>
            </Tooltip>
        </ClickableArea>
    );
});
