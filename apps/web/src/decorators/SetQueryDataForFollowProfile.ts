import type { SocialSource } from '@dimensiondev/enums';
import { SearchType } from '@dimensiondev/enums';
import { type Draft, produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import type { PageData } from '@/decorators/types.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { patchNotificationQueryDataOnAuthor } from '@/helpers/patchNotificationQueryData.js';
import { type Matcher, patchPostQueryData } from '@/helpers/patchPostQueryData.js';
import type { Notification, Profile, Provider } from '@/providers/types/SocialMedia.js';
import type { ClassType } from '@/types/utility.js';

export function setFollowStatus(source: SocialSource, profileId: string, status: boolean) {
    const matcher: Matcher = (post) => post?.author.profileId === profileId;
    const resolveViewerContextField = (
        profile: Profile,
        nextStatus: boolean,
    ): Extract<keyof NonNullable<Profile['viewerContext']>, 'following' | 'followPending'> => {
        if (profile.protected && nextStatus) {
            return 'followPending';
        }
        return 'following';
    };
    const patcher = (old: Draft<Profile>, status: boolean) => {
        const field = resolveViewerContextField(old, status);
        old.viewerContext = {
            ...old.viewerContext,
            [field]: status,
        };
    };
    patchPostQueryData(source, matcher, (draft) => {
        if (draft.author.profileId !== profileId) return;
        const field = resolveViewerContextField(draft.author, status);
        draft.author.viewerContext = {
            ...draft.author.viewerContext,
            [field]: status,
        };
    });

    queryClient.setQueriesData<Profile>({ queryKey: ['profile', source] }, (old) => {
        if (old?.profileId !== profileId) return old;
        return produce(old, (draft) => {
            const field = resolveViewerContextField(old, status);
            draft.viewerContext = {
                ...draft.viewerContext,
                [field]: status,
            };
        });
    });

    const profilesPatcher = (old: Draft<PageData<Profile>> | undefined) => {
        if (!old?.pages) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                if (!page) continue;

                for (const profile of page.data) {
                    if (profile.profileId === profileId) {
                        patcher(profile, status);
                    }
                }
            }
        });
    };

    queryClient.setQueriesData<PageData<Profile>>({ queryKey: ['profiles', source] }, profilesPatcher);
    queryClient.setQueriesData<PageData<Profile>>(
        { queryKey: ['search', SearchType.Profiles], type: 'active' },
        profilesPatcher,
    );
    queryClient.setQueriesData<PageData<Profile>>(
        { queryKey: ['suggested-follows', source], type: 'active' },
        profilesPatcher,
    );
    queryClient.setQueriesData<Profile[]>({ queryKey: ['suggested-follows-lite'] }, (profiles) => {
        if (!profiles) return profiles;

        return produce(profiles, (draft) => {
            for (const profile of draft) {
                if (profile.profileId === profileId) {
                    patcher(profile, status);
                }
            }
        });
    });

    patchNotificationQueryDataOnAuthor(source, (profile) => {
        if (profile.profileId === profileId) {
            patcher(profile, status);
        }
    });

    // Notifications user list tippy
    function matchProfile(profiles: Profile[], profileId: string) {
        for (const p of profiles) {
            if (p.profileId === profileId) {
                patcher(p, status);
                break;
            }
        }
    }

    queryClient.setQueriesData<{ pages: Array<{ data: Notification[] }> }>({ queryKey: ['notifications'] }, (old) => {
        if (!old?.pages) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                for (const notification of page.data) {
                    if ('reactors' in notification) {
                        matchProfile(notification.reactors, profileId);
                    } else if ('mirrors' in notification) {
                        matchProfile(notification.mirrors, profileId);
                    } else if ('followers' in notification) {
                        matchProfile(notification.followers, profileId);
                    } else if ('actions' in notification) {
                        matchProfile(notification.actions, profileId);
                    }
                }
            }
        });
    });

    const currentProfile = getCurrentProfileFromStorage(source);
    if (currentProfile?.profileId) {
        queryClient.setQueryData(['profile-follow-status', source, profileId, currentProfile.profileId], status);
    }
}

const METHODS_BE_OVERRIDDEN = ['follow', 'unfollow'] as const;

export function SetQueryDataForFollowProfile(source: SocialSource) {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as Provider[K];

            Object.defineProperty(target.prototype, key, {
                value: async (profileId: string) => {
                    const status = key === 'follow';
                    setFollowStatus(source, profileId, status);

                    try {
                        const m = method as (profileId: string) => Promise<boolean>;
                        return await m?.call(target.prototype, profileId);
                    } catch (error) {
                        // rolling back
                        setFollowStatus(source, profileId, !status);
                        throw error;
                    }
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);
        return target;
    };
}
