import { type Draft, produce } from 'immer';
import { first, uniqBy } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { toProfileId } from '@/helpers/isSameProfile.js';
import { patchNotificationQueryDataOnAuthor } from '@/helpers/patchNotificationQueryData.js';
import { type Matcher, patchPostQueryData } from '@/helpers/patchPostQueryData.js';
import { type Notification, NotificationType, type Profile, type Provider } from '@/providers/types/SocialMedia.js';
import type { ClassType } from '@/types/utility.js';

interface PagesData {
    pages: Array<{ data: Profile[] }>;
}

export function setBlockStatus(source: SocialSource, profileId: string, status: boolean) {
    const matcher: Matcher = (post) => post?.author.profileId === profileId;
    patchPostQueryData(source, matcher, (draft) => {
        draft.author.viewerContext = {
            ...draft.author.viewerContext,
            blocking: status,
        };
    });

    const profilesPatcher = (oldData: Draft<PagesData> | undefined) => {
        if (!oldData) return oldData;
        return produce(oldData, (draft) => {
            for (const page of draft.pages) {
                if (!page) continue;
                for (const mutedProfile of page.data) {
                    if (mutedProfile.profileId !== profileId) continue;

                    mutedProfile.viewerContext = {
                        ...mutedProfile.viewerContext,
                        blocking: status,
                    };
                }
            }
        });
    };

    queryClient.setQueriesData<Profile>({ queryKey: ['profile', source] }, (old) => {
        if (!old || old.profileId !== profileId) return old;
        return produce(old, (draft) => {
            draft.viewerContext = {
                ...draft.viewerContext,
                blocking: status,
            };
        });
    });

    queryClient.setQueriesData<{ pages: Array<{ data: Notification[] }> }>({ queryKey: ['notifications'] }, (old) => {
        if (!old) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                if (!page) continue;
                page.data = page.data.filter((notification) => {
                    switch (notification.type) {
                        case NotificationType.Comment:
                            return notification.comment?.author.profileId !== profileId;
                        case NotificationType.Quote:
                            const post = [Source.Bsky, Source.Farcaster].includes(notification.source)
                                ? notification.quote
                                : notification.post;
                            return post.author.profileId !== profileId;
                        case NotificationType.Mention:
                        case NotificationType.Act:
                            if (!notification.post) return true;
                            return notification.post.author;
                        case NotificationType.Follow:
                            if (notification.followers.length > 1) return true;
                            const follower = first(notification.followers);
                            if (!follower) return true;
                            return follower.profileId !== profileId;
                        case NotificationType.Mirror:
                            const mirrors = uniqBy(notification.mirrors, toProfileId);
                            if (mirrors.length > 1) return true;
                            const reporter = first(mirrors);
                            if (!reporter) return true;
                            return reporter.profileId !== profileId;
                        case NotificationType.Reaction:
                            if (notification.reactors.length > 1) return true;
                            const reactor = first(notification.reactors);
                            if (!reactor) return true;
                            return reactor.profileId !== profileId;
                        default:
                            return true;
                    }
                });
            }
        });
    });

    patchNotificationQueryDataOnAuthor(source, (profile) => {
        if (profile.profileId === profileId) {
            profile.viewerContext = {
                ...profile.viewerContext,
                blocking: status,
            };
        }
    });

    queryClient.setQueryData(['profile-is-blocked', source, profileId], status);
    queryClient.setQueryData(['profile-is-muted', source, profileId], status);
    queryClient.setQueriesData<PagesData>({ queryKey: ['profiles', source, 'muted-list'] }, profilesPatcher);
    queryClient.setQueriesData<PagesData>({ queryKey: ['suggested-follows', source], type: 'active' }, profilesPatcher);
    queryClient.refetchQueries({ queryKey: ['suggested-follows-lite'] });

    if (!status) queryClient.setQueryData(['profile', 'mute-all', source, profileId], status);
}

const METHODS_BE_OVERRIDDEN = ['blockProfile', 'unblockProfile'] as const;

export function SetQueryDataForBlockProfile(source: SocialSource) {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as Provider[K];

            Object.defineProperty(target.prototype, key, {
                value: async (profileId: string) => {
                    const m = method as (profileId: string) => Promise<boolean>;
                    const status = key === 'blockProfile';
                    try {
                        const result = await m?.call(target.prototype, profileId);
                        if (!result) {
                            // rolling back
                            setBlockStatus(source, profileId, !status);
                            return false;
                        }
                        setBlockStatus(source, profileId, status);
                        return result;
                    } catch (err) {
                        // rolling back
                        setBlockStatus(source, profileId, !status);
                        throw err;
                    }
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);
        return target;
    };
}
