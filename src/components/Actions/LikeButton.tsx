import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { memo } from 'react';

import LikeIcon from '@/assets/like-large.svg';
import LikedIcon from '@/assets/liked-large.svg';
import { ClickableArea } from '@/components/ClickableArea.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { ExtraLikeType, Source } from '@/constants/enum.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
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
                    className={classNames(
                        'inline-flex h-7 items-center justify-center gap-1 rounded-full px-1.5 transition-colors hover:bg-danger/20',
                        {
                            'text-danger': isLiked,
                            'text-second': !isLiked,
                        },
                    )}
                >
                    {isPending ? (
                        <LoadingIcon size={16} className="text-second" />
                    ) : (
                        <>
                            {isLiked ? <LikedIcon width={16} height={16} /> : <LikeIcon width={16} height={16} />}
                            {likeData?.likeCount > 0 && (
                                <span className="text-xs font-bold">{nFormatter(likeData.likeCount)}</span>
                            )}
                        </>
                    )}
                </motion.button>
            </Tooltip>
        </ClickableArea>
    );
});
