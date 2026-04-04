'use client';

import AnonymousAvatar from '@dimensiondev/assets/anonymous-avatar.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';
import { memo, useMemo, useState } from 'react';

import { Editor } from '@/components/Compose/Editor.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ExcludeReplyUserListModal } from '@/components/Posts/ExcludeReplyUserList.js';
import { PostBody } from '@/components/Posts/PostBody.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { ENABLED_REPLY_SOURCES } from '@/constants/computed.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useCurrentAvailableProfile } from '@/hooks/useCurrentProfile.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { type CompositePost } from '@/types/compose.js';

interface ReplyProps {
    post: Post;
    compositePost: CompositePost;
}

export const Reply = memo<ReplyProps>(function Reply({ post, compositePost }) {
    const isLarge = useIsLarge();
    const currentProfile = useCurrentAvailableProfile(post.source);

    const [open, setOpen] = useState(false);
    const { excludeReplyProfileIds = EMPTY_LIST } = useCompositePost();
    const updateExcludeReplyProfileIds = useComposeStateStore.use.updateExcludeReplyProfileIds();

    const { data, isLoading } = useQuery({
        queryKey: ['post-thread', post.source, post.postId],
        queryFn() {
            const provider = resolveSocialMediaProvider(post.source);
            return provider.getThreadByPostId(post.postId);
        },
    });

    const profiles = useMemo(() => uniqBy(data?.map((x) => x.author) ?? [], (x) => x.profileId), [data]);
    const replyingProfilesContent = useMemo(() => {
        const filteredProfiles = profiles.filter((profile) => !excludeReplyProfileIds.includes(profile.profileId));
        if (filteredProfiles.length === 2) {
            return (
                <Trans>
                    Replying to <span className="text-link">@{filteredProfiles[0].handle}</span> and{' '}
                    <span className="text-link">@{filteredProfiles[1].handle}</span> on {resolveSourceName(post.source)}
                </Trans>
            );
        }
        if (filteredProfiles.length === 3) {
            return (
                <Trans>
                    Replying to <span className="text-link">@{filteredProfiles[0].handle}</span>
                    {' ,'}
                    <span className="text-link">@{filteredProfiles[1].handle}</span> and{' '}
                    <span className="text-link">@{filteredProfiles[2].handle}</span> on {resolveSourceName(post.source)}
                </Trans>
            );
        }
        if (filteredProfiles.length >= 4) {
            return (
                <Trans>
                    Replying to <span className="text-link">@{filteredProfiles[0].handle}</span>
                    {' ,'}
                    <span className="text-link">@{filteredProfiles[1].handle}</span> and{' '}
                    <span className="text-link">{filteredProfiles.length - 2} others</span> on{' '}
                    {resolveSourceName(post.source)}
                </Trans>
            );
        }
        return (
            <Trans>
                Replying to <span className="text-link">@{post.author.handle}</span> on {resolveSourceName(post.source)}
            </Trans>
        );
    }, [excludeReplyProfileIds, post.author.handle, post.source, profiles]);

    return (
        <>
            <div className="flex gap-3">
                <div className="flex flex-col items-center">
                    <ProfileAvatar profile={post.author} enableSourceIcon={false} />
                    <div className="min-h-[40px] flex-1 border-[0.8px] border-gray-300 bg-gray-300 dark:border-gray-700 dark:bg-gray-700" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="w-full text-left">
                        <PostBody post={post} isReply disablePadding={post.isHidden || post.isEncrypted} />
                        {isLoading ? (
                            <p className="text-medium text-placeholder mt-3 flex min-h-[20px] items-center">
                                <Trans>
                                    <LoadingIcon className="mr-1" size={16} /> Loading
                                </Trans>
                            </p>
                        ) : ENABLED_REPLY_SOURCES.includes(post.source) ? (
                            <div className="text-medium text-placeholder mt-3 min-h-[20px] cursor-pointer">
                                {replyingProfilesContent}
                            </div>
                        ) : (
                            <ExcludeReplyUserListModal
                                post={post}
                                profiles={profiles}
                                onClose={() => setOpen(false)}
                                open={open}
                                excluded={excludeReplyProfileIds}
                                onClickProfile={(x, checked) => {
                                    updateExcludeReplyProfileIds(
                                        !checked
                                            ? [...excludeReplyProfileIds, x.profileId]
                                            : excludeReplyProfileIds.filter((id) => id !== x.profileId),
                                    );
                                }}
                            >
                                <div
                                    className="text-medium text-placeholder mt-3 min-h-[20px] cursor-pointer"
                                    onClick={() => setOpen(true)}
                                >
                                    {replyingProfilesContent}
                                </div>
                            </ExcludeReplyUserListModal>
                        )}
                    </div>
                </div>
            </div>
            <div className="relative flex flex-1 gap-3">
                {compositePost.isAnonymous ? (
                    <AnonymousAvatar width={isLarge ? 40 : 36} height={isLarge ? 40 : 36} />
                ) : currentProfile ? (
                    <ProfileAvatar profile={currentProfile} enableSourceIcon={false} />
                ) : null}
                <div className="flex flex-1 pt-2">
                    <Editor post={compositePost} replying />
                </div>
            </div>
        </>
    );
});
