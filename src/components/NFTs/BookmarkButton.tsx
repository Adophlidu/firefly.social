import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { usePathname } from 'next/navigation.js';
import { memo } from 'react';

import BookmarkActiveIcon from '@/assets/bookmark.selected.svg';
import BookmarkIcon from '@/assets/bookmark.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { FireflyPlatform } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { useHasBookmarked } from '@/hooks/useHasBookmarked.js';
import { useToggleNFTBookmark } from '@/hooks/useToggleNFTBookmark.js';
import { ConfirmModalRef } from '@/modals/controls.js';

interface BookmarkButtonProps extends Omit<ClickableButtonProps, 'children'> {
    nftId: string;
    ownerAddress?: string;
    bookmarked?: boolean;
    tooltip?: boolean;
    strict?: boolean;
    children?: (hasBookmarked: boolean, isLoading: boolean, fetching: boolean) => React.ReactNode;
    onClick?: () => void;
}

export function BookmarkButton({
    children,
    nftId,
    ownerAddress = '',
    bookmarked,
    ref,
    tooltip,
    strict,
    onClick,
    ...rest
}: BookmarkButtonProps) {
    const pathname = usePathname();

    const disableFetch = bookmarked !== undefined && !isRoutePathname(pathname, '/nft/:chainId/:address/:tokenId');
    const {
        isLoading,
        data = false,
        bookmarkId,
    } = useHasBookmarked(FireflyPlatform.NFTs, nftId, undefined, disableFetch);

    const [isMutating, mutation] = useToggleNFTBookmark({
        owner: ownerAddress,
        nftId: bookmarkId || nftId,
        strict: strict || !!bookmarkId,
    });

    const hasBookmarked = disableFetch ? bookmarked : data;

    const content = (
        <ClickableButton
            {...rest}
            ref={ref}
            disabled={isMutating || isLoading}
            onClick={async () => {
                const confirmed = hasBookmarked
                    ? await ConfirmModalRef.openAndWaitForClose({
                          resetSize: true,
                          title: t`Remove from bookmarks`,
                          modalStyle: { width: 400, maxWidth: '90vw' },
                          content: (
                              <div className="text-main">
                                  <Trans>Are you sure you want to remove this NFT from your bookmarks?</Trans>
                              </div>
                          ),
                          variant: 'normal',
                      })
                    : true;
                if (!confirmed) return;
                await mutation.mutateAsync(hasBookmarked);
                onClick?.();
            }}
        >
            {children?.(hasBookmarked, isMutating, isLoading)}
        </ClickableButton>
    );

    return tooltip ? (
        <Tooltip placement="top" content={hasBookmarked ? t`Remove from Bookmarks` : t`Bookmark`}>
            {content}
        </Tooltip>
    ) : (
        content
    );
}

function BookmarkButtonIcon({ hasBookmarked, isLoading }: { hasBookmarked: boolean; isLoading: boolean }) {
    return isLoading ? (
        <LoadingIcon size={20} />
    ) : hasBookmarked ? (
        <BookmarkActiveIcon width={20} height={20} className="text-warn" />
    ) : (
        <BookmarkIcon width={20} height={20} />
    );
}

export const BookmarkInIcon = memo(function BookmarkInIcon({
    small,
    ...rest
}: BookmarkButtonProps & { small?: boolean }) {
    return (
        <BookmarkButton {...rest}>
            {(bookmarked: boolean, isLoading: boolean, fetching: boolean) => (
                <span
                    className={
                        small
                            ? ''
                            : classNames(
                                  'flex size-8 items-center justify-center rounded-xl bg-black/25 text-white',
                                  bookmarked
                                      ? 'text-warn'
                                      : 'hover:bg-warn/20 hover:text-warn active:bg-black/25 active:text-warn',
                              )
                    }
                >
                    {isLoading || fetching ? (
                        <LoadingIcon size={20} />
                    ) : (
                        <BookmarkIcon
                            fill={bookmarked ? 'rgb(var(--color-warn))' : 'none'}
                            width={20}
                            height={20}
                            className={classNames('size-5', bookmarked ? 'text-warn' : '')}
                        />
                    )}
                </span>
            )}
        </BookmarkButton>
    );
});

export function BookmarkInMenu({ className, ref, ...rest }: BookmarkButtonProps) {
    return (
        <BookmarkButton
            {...rest}
            className={classNames('flex h-8 cursor-pointer items-center space-x-2 px-3 py-1 hover:bg-bg', className)}
            ref={ref}
        >
            {(hasBookmarked: boolean, isLoading: boolean, fetching: boolean) => (
                <>
                    <BookmarkButtonIcon hasBookmarked={hasBookmarked} isLoading={isLoading || fetching} />
                    <span className="font-bold leading-[22px] text-main">
                        {hasBookmarked ? <Trans>Remove from Bookmarks</Trans> : <Trans>Bookmark</Trans>}
                    </span>
                </>
            )}
        </BookmarkButton>
    );
}
