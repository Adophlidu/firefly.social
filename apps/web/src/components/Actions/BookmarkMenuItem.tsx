'use client';

import BookmarkActiveIcon from '@dimensiondev/assets/bookmark.selected.svg';
import BookmarkIcon from '@dimensiondev/assets/bookmark.svg';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { MenuButton } from '@/components/Actions/MenuButton.js';

interface BookmarkMenuItemProps {
    hasBookmarked?: boolean;
    loading?: boolean;
    onClick: () => void;
}

export const BookmarkMenuItem = memo<BookmarkMenuItemProps>(function BookmarkMenuItem({ hasBookmarked, onClick }) {
    return (
        <MenuButton onClick={onClick}>
            {hasBookmarked ? (
                <BookmarkActiveIcon width={18} height={18} className="text-warn" />
            ) : (
                <BookmarkIcon width={18} height={18} />
            )}
            <span className="font-bold leading-[22px] text-main">
                <Trans>Bookmark</Trans>
            </span>
        </MenuButton>
    );
});
