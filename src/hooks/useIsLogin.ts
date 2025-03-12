import { type NotificationSource, type SocialSource, Source } from '@/constants/enum.js';
import { SOCIAL_DISCOVER_SOURCE, SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function useIsLogin(source?: SocialSource) {
    const profilesAll = useCurrentProfilesAll();

    if (source) return !!profilesAll[source]?.profileId;
    return SORTED_SOCIAL_SOURCES.some((x) => !!profilesAll[x]?.profileId);
}

export function useIsLoginFirefly() {
    const { currentProfileSession } = useFireflyStateStore();
    return !!currentProfileSession;
}

export function useIsLoginNotifications(source: NotificationSource) {
    const profilesAll = useCurrentProfilesAll();
    const { currentProfileSession } = useFireflyStateStore();

    if (source === Source.Notifications) return !!currentProfileSession;
    return !!profilesAll[source]?.profileId;
}

export function useIsLoginDiscoverSource() {
    const profilesAll = useCurrentProfilesAll();
    return SOCIAL_DISCOVER_SOURCE.some((source) => !!profilesAll[source]?.profileId);
}
