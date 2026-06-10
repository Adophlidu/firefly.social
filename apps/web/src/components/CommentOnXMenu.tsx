'use client';

import ReplyIcon from '@dimensiondev/assets/reply.svg';
import { classNames } from '@dimensiondev/utils';
import { MenuButton as HeadlessMenuButton, MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback } from 'react';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { humanize } from '@/helpers/formatCommentCounts.js';
import { openUrl } from '@/helpers/openUrl.js';
import { resolveMessageForCommentDisabled } from '@/helpers/resolveMessageForCommentDisabled.js';
import { resolveXReplyUrl } from '@/helpers/resolveXReplyUrl.js';
import { stopEvent } from '@/helpers/stopEvent.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';

interface CommentOnXMenuProps {
    /** The reply-restricted X post. */
    post: Post;
    count?: number;
}

/**
 * Reply icon for a reply-restricted X post.
 *
 * X's API only allows replying to posts that mention you, so the icon opens a
 * dropdown (mirroring the Repost/Quote menu) offering to continue on the
 * official X site. Opening the menu also surfaces the restriction warning.
 *   - "Comment on X once": open X for this click only.
 *   - "Comment on X always": persist the choice so future clicks skip the menu.
 */
export const CommentOnXMenu = memo<CommentOnXMenuProps>(function CommentOnXMenu({ post, count = 0 }) {
    const commentOnX = useCallback(
        (always: boolean) => {
            if (always) usePreferencesState.getState().setPreference('ALWAYS_COMMENT_ON_X', true);
            openUrl(resolveXReplyUrl(post.postId));
        },
        [post.postId],
    );

    const handleMenuOpenChange = useCallback(
        (open: boolean) => {
            if (!open) return;
            const message = resolveMessageForCommentDisabled(post)?.message;
            if (message) enqueueWarningMessage(message);
        },
        [post],
    );

    return (
        <MoreActionMenu
            source={post.source}
            loginRequired={false}
            menuOnClick={stopEvent}
            onMenuOpenChange={handleMenuOpenChange}
            menuButton={
                <HeadlessMenuButton
                    className="relative flex w-min cursor-pointer items-center text-second hover:text-link md:space-x-2"
                    aria-label="Comment"
                    onClick={stopEvent}
                >
                    <Tooltip
                        placement="top"
                        content={count > 0 ? <Trans>{humanize(count)} Comments</Trans> : <Trans>Comment</Trans>}
                    >
                        <span className="inline-flex size-7 items-center justify-center rounded-full hover:bg-link/[0.2] hover:text-link">
                            <ReplyIcon width={16} height={16} />
                        </span>
                    </Tooltip>
                </HeadlessMenuButton>
            }
        >
            <MenuGroup anchor="bottom start">
                <MenuItem>
                    {({ close }) => (
                        <MenuButton
                            className={classNames('w-full')}
                            onClick={() => {
                                close();
                                commentOnX(false);
                            }}
                        >
                            <ReplyIcon width={18} height={18} />
                            <span className="font-bold leading-[22px] text-main">
                                <Trans>Comment on X once</Trans>
                            </span>
                        </MenuButton>
                    )}
                </MenuItem>

                <MenuItem>
                    {({ close }) => (
                        <MenuButton
                            className={classNames('w-full')}
                            onClick={() => {
                                close();
                                commentOnX(true);
                            }}
                        >
                            <ReplyIcon width={18} height={18} />
                            <span className="font-bold leading-[22px] text-main">
                                <Trans>Comment on X always</Trans>
                            </span>
                        </MenuButton>
                    )}
                </MenuItem>
            </MenuGroup>
        </MoreActionMenu>
    );
});
