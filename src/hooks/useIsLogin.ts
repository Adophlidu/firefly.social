import { type NotificationSource, type SocialSource, Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { useCurrentProfileAll } from '@/hooks/useCurrentProfile.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function useIsLogin(source?: SocialSource) {
    const currentProfileAll = useCurrentProfileAll();

    if (source) return !!currentProfileAll[source]?.profileId;
    return SORTED_SOCIAL_SOURCES.some((x) => !!currentProfileAll[x]?.profileId);
}

export function useIsLoginFirefly() {
    const { currentProfileSession } = useFireflyStateStore();
    return !!currentProfileSession;
}

export function useIsLoginNotifications(source: NotificationSource) {
    const currentProfileAll = useCurrentProfileAll();
    const { currentProfileSession } = useFireflyStateStore();

    if (source === Source.Notifications) return !!currentProfileSession;
    return !!currentProfileAll[source]?.profileId;
}
