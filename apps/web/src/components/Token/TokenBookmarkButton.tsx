'use client';

import BookmarkActiveIcon from '@dimensiondev/assets/bookmark.selected.svg';
import BookmarkIcon from '@dimensiondev/assets/bookmark.svg';
import WarningFill from '@dimensiondev/assets/warning-fill.svg';
import { FireflyPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { memo } from 'react';

import { ClickableArea, type ClickableAreaProps } from '@/components/ClickableArea.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { Link } from '@/esm/Link.js';
import { enqueueErrorMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveTokenBookmarkId } from '@/helpers/resolveTokenBookmarkId.js';
import { useHasBookmarked } from '@/hooks/useHasBookmarked.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { fireflyBookmarkProvider } from '@/providers/firefly/Bookmark.js';
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
                await fireflyBookmarkProvider.unbookmarkToken({
                    coinId,
                    chainId,
                    address,
                });
                enqueueSuccessMessage(<Trans>Token removed from your Bookmarks.</Trans>);
            } else {
                await fireflyBookmarkProvider.bookmarkToken({
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
            className={classNames('text-second flex cursor-pointer items-center space-x-1 md:space-x-2', {
                'cursor-not-allowed opacity-50': disabled,
            })}
            {...props}
        >
            <Tooltip disabled={disabled} placement="top" content={content}>
                <motion.button
                    disabled={disabled}
                    whileTap={{ scale: 0.9 }}
                    className="hover:bg-warn/[.20] hover:text-warn inline-flex size-5 items-center justify-center rounded-full"
                    aria-label="Bookmark"
                    onClick={() => {
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
