'use client';

import BookmarkActiveIcon from '@dimensiondev/assets/bookmark.selected.svg';
import BookmarkIcon from '@dimensiondev/assets/bookmark.svg';
import MoreIcon from '@dimensiondev/assets/more.svg';
import { formatAddress } from '@dimensiondev/web3/utils';
import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MuteWalletButton } from '@/components/Actions/MuteWalletButton.js';
import { WatchWalletButton } from '@/components/Actions/WatchWalletButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { Source } from '@/constants/enum.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useToggleSnapshotBookmark } from '@/hooks/useToggleSnapshotBookmark.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';

interface MoreProps {
    data: SnapshotActivity;
}

export const SnapshotMoreAction = memo<MoreProps>(function SnapshotMoreAction({ data }) {
    const mutation = useToggleSnapshotBookmark();
    const author = data.author;
    const isBusy = mutation.isPending;

    const identity = useFireflyIdentity(Source.Wallet, author.id);
    const isMyProfile = useIsMyRelatedProfile(identity.source, identity.id);

    const { data: ens } = useEnsName(author.id, !author.handle);
    const handleOrEnsOrAddress = author.handle || ens || formatAddress(author.id, 4);

    return (
        <MoreActionMenu
            button={
                isBusy ? (
                    <span className="inline-flex size-6 animate-spin items-center justify-center">
                        <LoadingIcon size={16} className="text-secondary" />
                    </span>
                ) : (
                    <Tooltip content={<Trans>More</Trans>} placement="top">
                        <MoreIcon className="text-secondary" width={24} height={24} />
                    </Tooltip>
                )
            }
        >
            <MenuGroup>
                {!isMyProfile && (
                    <>
                        <MenuItem>
                            {({ close }) => (
                                <WatchWalletButton
                                    handleOrEnsOrAddress={handleOrEnsOrAddress}
                                    isFollowing={author.isFollowing}
                                    address={author.id}
                                    onClick={close}
                                />
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ close }) => (
                                <MuteWalletButton
                                    handleOrEnsOrAddress={handleOrEnsOrAddress}
                                    isMuted={author.isMuted}
                                    address={author.id}
                                    onClick={close}
                                />
                            )}
                        </MenuItem>
                    </>
                )}
                <MenuItem>
                    {({ close }) => (
                        <MenuButton
                            onClick={() => {
                                mutation.mutate(data);
                                close();
                            }}
                        >
                            {data.hasBookmarked ? (
                                <BookmarkActiveIcon width={18} height={18} className="text-warn" />
                            ) : (
                                <BookmarkIcon width={18} height={18} />
                            )}
                            <span className="text-main font-bold leading-[22px]">
                                {data.hasBookmarked ? <Trans>Remove from Bookmarks</Trans> : <Trans>Bookmark</Trans>}
                            </span>
                        </MenuButton>
                    )}
                </MenuItem>
            </MenuGroup>
        </MoreActionMenu>
    );
});
