import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import BookmarkSelectedIcon from '@/assets/bookmark.selected.svg';
import BookmarkIcon from '@/assets/bookmark.svg';
import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { Source } from '@/constants/enum.js';
import { BOOKMARK_SOURCES, DEFAULT_BOOKMARK_SOURCE } from '@/constants/index.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';

interface BookmarkMenuProps {
    isSelected: boolean;
    collapsed: boolean;
    size?: number;
}

export const BookmarkMenu = memo<BookmarkMenuProps>(function BookmarkMenu({ isSelected, collapsed, size = 20 }) {
    const allProfiles = useCurrentProfilesAll();
    const bookmarkUrl = useMemo(() => {
        const expectedSource = BOOKMARK_SOURCES.find((source) => {
            switch (source) {
                case Source.Farcaster:
                case Source.Bsky:
                case Source.Lens:
                    return !!allProfiles[source]?.profileId;
                default:
                    return false;
            }
        });

        return resolveBookmarkUrl(expectedSource || DEFAULT_BOOKMARK_SOURCE);
    }, [allProfiles]);

    const Icon = isSelected ? BookmarkSelectedIcon : BookmarkIcon;

    return (
        <BaseMenuItem
            href={bookmarkUrl}
            isSelected={isSelected}
            collapsed={collapsed}
            menuName={<Trans>Bookmarks</Trans>}
            icon={<Icon width={20} height={20} />}
        />
    );
});
