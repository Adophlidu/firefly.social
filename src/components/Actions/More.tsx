import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback } from 'react';

import EngagementIcon from '@/assets/engagement.svg';
import FollowUserIcon from '@/assets/follow-user.svg';
import MoreIcon from '@/assets/more.svg';
import PendingIcon from '@/assets/pending.svg';
import TrashIcon from '@/assets/trash.svg';
import UnFollowUserIcon from '@/assets/unfollow-user.svg';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MuteChannelButton } from '@/components/Actions/MuteChannelButton.js';
import { MuteProfileButton } from '@/components/Actions/MuteProfileButton.js';
import { PostBookmark } from '@/components/Actions/PostBookmark.js';
import { ReportPostButton } from '@/components/Actions/ReportPostButton.js';
import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { ToggleFollowButton } from '@/components/Profile/ToggleFollowButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { ENABLED_BOOKMARK_SOURCES } from '@/constants/index.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolvePostEngagementUrl } from '@/helpers/resolveEngagementUrl.js';
import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useDeletePost } from '@/hooks/useDeletePost.js';
import { useEverSeen } from '@/hooks/useEverSeen.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useRefreshedProfile } from '@/hooks/useRefreshedProfile.js';
import { useReportPost } from '@/hooks/useReportPost.js';
import { useToggleMutedChannel } from '@/hooks/useToggleMutedChannel.js';
import { useToggleMutedProfile } from '@/hooks/useToggleMutedProfile.js';
import type { Channel, Post, Profile } from '@/providers/types/SocialMedia.js';

interface MoreProps {
    source: SocialSource;
    author: Profile;
    channel?: Channel;
    post?: Post;
}

export const MoreAction = memo<MoreProps>(function MoreAction({ source, author: propAuthor, post, channel }) {
    const [seen, ref] = useEverSeen<HTMLButtonElement>();
    const currentProfile = useCurrentProfile(source);

    const isMyPost = isSameProfile(propAuthor, currentProfile);
    const isMyProfile = useIsMyRelatedProfile(source, resolveFireflyProfileId(propAuthor) ?? '');
    // profile in x3pro (also tweet) doesn't have viewerContext status
    const needToRefreshAuthor =
        !isMyProfile && seen && source === Source.Twitter && propAuthor?.viewerContext?.following === undefined;
    const { data: refreshedAuthor } = useRefreshedProfile(propAuthor, needToRefreshAuthor);
    const author = refreshedAuthor ?? propAuthor;

    const isFollowing = !!author?.viewerContext?.following;
    const isPending = !!author?.viewerContext?.followPending;

    const [{ loading: deleting }, deletePost] = useDeletePost(source);
    const [, reportPost] = useReportPost();
    const [, toggleMutedProfile] = useToggleMutedProfile(source);
    const [, toggleMutedChannel] = useToggleMutedChannel();

    const followButtonLabelRender = useCallback(
        (showSuperFollow: boolean, loading: boolean) => {
            const icon = loading ? (
                <LoadingIcon size={18} />
            ) : isPending ? (
                <PendingIcon width={18} height={18} />
            ) : isFollowing ? (
                <UnFollowUserIcon width={18} height={18} />
            ) : (
                <FollowUserIcon width={18} height={18} />
            );
            return (
                <>
                    {icon}
                    <span className="font-bold leading-[22px] text-main">
                        {showSuperFollow ? (
                            <Trans>Super Follow</Trans>
                        ) : isPending ? (
                            <Trans>Follow Pending</Trans>
                        ) : isFollowing ? (
                            <Trans>Unfollow @{author.handle}</Trans>
                        ) : (
                            <Trans>Follow @{author.handle}</Trans>
                        )}
                    </span>
                </>
            );
        },
        [isPending, isFollowing, author.handle],
    );

    // all menu items are hidden
    if (
        !isMyPost &&
        isMyProfile &&
        !(channel && currentProfile) &&
        !(post && post.source !== Source.Twitter) &&
        !(post?.postId && post.source !== Source.Twitter)
    )
        return null;

    return (
        <MoreActionMenu
            className="z-10"
            source={source}
            button={
                <Tooltip content={<Trans>More</Trans>} placement="top">
                    <MoreIcon width={20} height={20} className="text-secondary" />
                </Tooltip>
            }
        >
            <MenuGroup>
                {isMyPost ? (
                    <MenuItem>
                        {({ close }) => (
                            <MenuButton
                                onClick={() => {
                                    close();
                                    if (post?.postId) deletePost(post);
                                }}
                            >
                                {deleting ? (
                                    <LoadingIcon size={18} className="text-danger" />
                                ) : (
                                    <TrashIcon width={18} height={18} className="text-danger" />
                                )}
                                <span className="font-bold leading-[22px] text-danger">
                                    <Trans>Delete post</Trans>
                                </span>
                            </MenuButton>
                        )}
                    </MenuItem>
                ) : (
                    <>
                        {!isMyProfile ? (
                            <>
                                <MenuItem>
                                    {({ close }) => (
                                        <ToggleFollowButton
                                            className="flex h-8 cursor-pointer items-center space-x-2 px-3 py-1 hover:bg-bg"
                                            onClick={close}
                                            profile={author}
                                            ref={ref}
                                        >
                                            {followButtonLabelRender}
                                        </ToggleFollowButton>
                                    )}
                                </MenuItem>
                                {post && [Source.Lens, Source.Farcaster].includes(source) ? (
                                    <MenuItem>
                                        {({ close }) => (
                                            <ReportPostButton post={post} onReport={reportPost} onClick={close} />
                                        )}
                                    </MenuItem>
                                ) : null}
                            </>
                        ) : null}
                        {channel && source === Source.Farcaster ? (
                            <MenuItem>
                                {({ close }) => (
                                    <MuteChannelButton
                                        channel={channel}
                                        onToggle={async (channel: Channel) => {
                                            const result = await toggleMutedChannel(channel);
                                            queryClient.refetchQueries({
                                                queryKey: ['posts', channel.source],
                                            });
                                            return result;
                                        }}
                                        onClick={close}
                                    />
                                )}
                            </MenuItem>
                        ) : null}
                        {!isMyProfile ? (
                            <MenuItem>
                                {({ close }) => (
                                    <MuteProfileButton profile={author} onToggle={toggleMutedProfile} onClick={close} />
                                )}
                            </MenuItem>
                        ) : null}
                    </>
                )}
                {post && ENABLED_BOOKMARK_SOURCES.includes(post.source) ? (
                    <MenuItem>{({ close }) => <PostBookmark onlyIcon={false} post={post} onClick={close} />}</MenuItem>
                ) : null}
                {post?.postId && post.source !== Source.Twitter ? (
                    <MenuItem>
                        <Link
                            shallow
                            href={resolvePostEngagementUrl(post)}
                            className="box-border flex h-8 cursor-pointer items-center space-x-2 px-3 py-1 hover:bg-bg"
                            onClick={stopPropagation}
                        >
                            <EngagementIcon width={18} height={18} />
                            <span className="font-bold leading-[22px] text-main">
                                <Trans>View engagements</Trans>
                            </span>
                        </Link>
                    </MenuItem>
                ) : null}
            </MenuGroup>
        </MoreActionMenu>
    );
});
