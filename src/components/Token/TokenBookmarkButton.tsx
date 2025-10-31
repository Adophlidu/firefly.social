import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { memo } from 'react';

import BookmarkActiveIcon from '@/assets/bookmark.selected.svg';
import BookmarkIcon from '@/assets/bookmark.svg';
import WarningFill from '@/assets/warning-fill.svg';
import { ClickableArea, type ClickableAreaProps } from '@/components/ClickableArea.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { FireflyPlatform } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { enqueueErrorMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveTokenBookmarkId } from '@/helpers/resolveTokenBookmarkId.js';
import { useHasBookmarked } from '@/hooks/useHasBookmarked.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import {
    captureBookmarkTokenViewEvent,
    captureTokenBookmarkClickEvent,
} from '@/providers/telemetry/captureTokenEvent.js';
import type { BookmarkTokenOptions } from '@/providers/types/Bookmark.js';

interface Props extends ClickableAreaProps, BookmarkTokenOptions {
    bookmarked?: boolean;
}
export const TokenBookmarkButton = memo<Props>(function TokenBookmarkButton({
    disabled = false,
    coinId,
    chainId,
    address,
    bookmarked: propBookmarked,
    className,
    ...props
}) {
    const isLogin = useIsLogin();

    const bookmarkContentId = resolveTokenBookmarkId({ coinId, chainId, address });
    const query = useHasBookmarked(FireflyPlatform.Token, bookmarkContentId, undefined, propBookmarked !== undefined);
    const bookmarked = propBookmarked || query.data;
    const captureBookmarkToastClick = () => {
        captureBookmarkTokenViewEvent('toast_view');
    };

    const { isPending, mutate } = useMutation({
        mutationKey: ['bookmark-token', bookmarkContentId, isLogin],
        mutationFn: async (bookmarked: boolean) => {
            if (!isLogin) return;
            if (bookmarked) {
                await FireflySocialMediaProvider.unbookmarkToken({
                    coinId,
                    chainId,
                    address,
                });
                enqueueSuccessMessage(<Trans>Token removed from your Bookmarks.</Trans>);
            } else {
                await FireflySocialMediaProvider.bookmarkToken({
                    coinId,
                    chainId,
                    address,
                });
                enqueueSuccessMessage(
                    <Trans>
                        Token added to your Bookmarks.{' '}
                        <Link href="/bookmarks/tokens" className="underline" onClick={captureBookmarkToastClick}>
                            View
                        </Link>
                    </Trans>,
                );
            }
        },
        onError: (error) => {
            enqueueErrorMessage(
                bookmarked ? (
                    <Trans>Failed to remove from Bookmarks. {error.message}</Trans>
                ) : (
                    <Trans>Failed to add to Bookmarks. {error.message}</Trans>
                ),
                { icon: <WarningFill className="size-6 text-white" /> },
            );
        },
    });
    const content = bookmarked ? <Trans>Remove from Bookmarks</Trans> : <Trans>Bookmark</Trans>;

    if (!isLogin) return null;

    return (
        <ClickableArea
            className={classNames('flex cursor-pointer items-center space-x-1 text-second md:space-x-2', {
                'cursor-not-allowed opacity-50': disabled,
            })}
            {...props}
        >
            <Tooltip disabled={disabled} placement="top" content={content}>
                <motion.button
                    disabled={disabled}
                    whileTap={{ scale: 0.9 }}
                    className="inline-flex size-5 items-center justify-center rounded-full hover:bg-warn/[.20] hover:text-warn"
                    aria-label="Bookmark"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        mutate(!!bookmarked);
                        captureTokenBookmarkClickEvent();
                    }}
                >
                    {isPending ? (
                        <LoadingIcon width={20} height={20} />
                    ) : bookmarked ? (
                        <BookmarkActiveIcon width={20} height={20} className="text-warn" />
                    ) : (
                        <BookmarkIcon width={20} height={20} />
                    )}
                </motion.button>
            </Tooltip>
        </ClickableArea>
    );
});
