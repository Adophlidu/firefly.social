import { t } from '@lingui/core/macro';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { RestrictionType } from '@/constants/enum.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { useAnonymousPostAvailability } from '@/hooks/useAnonymousPostAvailability.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { ComposeModalRef } from '@/modals/ComposeModal.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useCommentPost(post: Post, disabled = false) {
    const { source, author, restrictions, mentions } = post;

    const myProfile = useCurrentProfile(source);
    const isLogin = !!myProfile?.profileId;

    const { data: authorProfile = null } = useQuery({
        queryKey: ['profile', source, author.profileId, myProfile?.profileId],
        staleTime: 1000 * 60 * 1, // 1 minute
        queryFn: async () => {
            const provider = resolveSocialMediaProvider(source);
            return provider.getProfileById(author.profileId);
        },
        enabled: !disabled && !('canComment' in post),
    });

    const commentDisabled = useMemo(() => {
        if (disabled) return true;
        if ('canComment' in post) return !post.canComment;
        if (restrictions) {
            if (isSameProfile(author, myProfile)) return false;
            let isDisabled = true;
            for (const restriction of restrictions) {
                switch (restriction) {
                    case RestrictionType.Nobody:
                        return !isSameProfile(myProfile, author);
                    case RestrictionType.Everyone:
                        return false;
                    case RestrictionType.MentionedProfiles:
                        if (mentions?.some((x) => isSameProfile(x, myProfile))) isDisabled = false;
                        break;
                    case RestrictionType.YouFollower:
                        if (authorProfile?.viewerContext?.following) isDisabled = false;
                        break;
                    case RestrictionType.OnlyPeopleYouFollow:
                        if (authorProfile?.viewerContext?.followedBy) isDisabled = false;
                        break;
                    default:
                        safeUnreachable(restriction);
                }
            }
            return isDisabled;
        }
        return false;
    }, [
        disabled,
        post,
        restrictions,
        myProfile,
        author,
        mentions,
        authorProfile?.viewerContext?.following,
        authorProfile?.viewerContext?.followedBy,
    ]);

    const { canPost, sources } = useAnonymousPostAvailability();
    const anonymousPostEnabled = !isLogin && canPost && sources.includes(source);

    const handleClick = useCallback(async () => {
        if (!isLogin && !anonymousPostEnabled) {
            openLoginModal({ source });
            return;
        }
        if (!commentDisabled) {
            ComposeModalRef.open({
                type: 'reply',
                post,
                source,
                channel: post.channel,
                isAnonymous: anonymousPostEnabled,
            });
        } else {
            enqueueErrorMessage(t`You cannot reply to @${author.handle} on ${resolveSourceName(source)}.`);
        }
    }, [isLogin, commentDisabled, source, post, author.handle, anonymousPostEnabled]);

    return {
        buttonDisabled: !isLogin ? disabled : commentDisabled,
        onComment: handleClick,
    };
}
