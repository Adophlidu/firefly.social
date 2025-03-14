import { t } from '@lingui/core/macro';
import { motion } from 'framer-motion';
import { memo } from 'react';

import BookmarkActiveIcon from '@/assets/bookmark.selected.svg';
import BookmarkIcon from '@/assets/bookmark.svg';
import { ClickableArea } from '@/components/ClickableArea.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { classNames } from '@/helpers/classNames.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';

interface BookmarkProps {
    count?: number;
    disabled?: boolean;
    hasBookmarked?: boolean;
    hiddenCount?: boolean;
    loading?: boolean;
    onlyIcon?: boolean;
    tooltip?: boolean;
    onClick: () => void;
}

export const Bookmark = memo<BookmarkProps>(function Bookmark({
    count = 0,
    disabled = false,
    hasBookmarked,
    hiddenCount = false,
    loading = false,
    onlyIcon = true,
    tooltip = true,
    onClick,
}) {
    const content = hasBookmarked ? t`Remove from Bookmarks` : t`Bookmark`;

    return (
        <ClickableArea
            className={classNames('flex cursor-pointer items-center space-x-1 text-lightSecond md:space-x-2', {
                'cursor-not-allowed opacity-50': disabled,
            })}
            onClick={onClick}
        >
            <Tooltip disabled={disabled || !tooltip} placement="top" content={content}>
                <motion.button
                    disabled={disabled}
                    whileTap={{ scale: 0.9 }}
                    className={classNames('inline-flex items-center', {
                        'size-7 justify-center rounded-full hover:bg-warn/[.20] hover:text-warn': onlyIcon,
                        'h-8 w-full gap-2 px-3 text-main hover:bg-bg': !onlyIcon,
                    })}
                    aria-label="Bookmark"
                >
                    {loading ? (
                        <LoadingIcon width={20} height={20} />
                    ) : hasBookmarked ? (
                        <BookmarkActiveIcon width={20} height={20} className="text-warn" />
                    ) : (
                        <BookmarkIcon width={20} height={20} />
                    )}
                    {!onlyIcon ? <span className="font-bold leading-[22px] text-main">{content}</span> : null}
                </motion.button>
            </Tooltip>
            {!hiddenCount && count ? <span className="text-xs font-medium text-main">{nFormatter(count)}</span> : null}
        </ClickableArea>
    );
});
