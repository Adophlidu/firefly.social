import { t } from '@lingui/core/macro';
import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { RestrictionType } from '@/constants/enum.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { ComposeModalRef, LoginModalRef } from '@/modals/controls.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useCommentPost(post: Post, disabled = false) {
    const { source, author, restrictions, mentions } = post;

    const profile = useCurrentProfile(source);
    const isLogin = !!profile?.profileId;

    const { data: authorProfile = null } = useQuery({
        queryKey: ['profile', source, author.profileId, isLogin],
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
            if (isSameProfile(author, profile)) return false;
            let isDisabled = true;
            for (const restriction of restrictions) {
                switch (restriction) {
                    case RestrictionType.Nobody:
                        return !isSameProfile(profile, author);
                    case RestrictionType.Everyone:
                        return false;
                    case RestrictionType.MentionedProfiles:
                        if (mentions?.some((x) => isSameProfile(x, profile))) isDisabled = false;
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
        profile,
        author,
        mentions,
        authorProfile?.viewerContext?.following,
        authorProfile?.viewerContext?.followedBy,
    ]);

    const handleClick = useCallback(async () => {
        if (!isLogin) {
            LoginModalRef.open({ source });
            return;
        }
        if (!commentDisabled) {
            ComposeModalRef.open({
                type: 'reply',
                post,
                source,
                channel: post.channel,
            });
        } else {
            enqueueErrorMessage(t`You cannot reply to @${author.handle} on ${resolveSourceName(source)}.`);
        }
    }, [isLogin, commentDisabled, source, post, author.handle]);

    return {
        buttonDisabled: !isLogin ? disabled : commentDisabled,
        onComment: handleClick,
    };
}
