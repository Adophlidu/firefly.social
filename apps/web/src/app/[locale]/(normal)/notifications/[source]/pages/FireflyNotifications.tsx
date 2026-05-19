import { EMPTY_LIST } from '@dimensiondev/constants';
import { SOCIAL_NOTIFICATION_TYPES, UNIFIED_NOTIFICATION_TYPES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { NotificationType, ScrollListKey, Source } from '@dimensiondev/enums';
import { useMultiInfiniteQueryPageable } from '@dimensiondev/hooks';
import { createIndicator, createPageable } from '@dimensiondev/utils';
import { memo, useMemo } from 'react';

import { getNotificationItemContent } from '@/app/[locale]/(normal)/notifications/[source]/pages/getNotificationItemContent.js';
import { updateNotificationReadStatus } from '@/app/[locale]/(normal)/notifications/[source]/pages/updateNotificationReadStatus.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useNotificationSources } from '@/hooks/useNotificationSources.js';
import { getAllNotifications } from '@/providers/firefly/endpoint/getAllNotifications.js';
import { getScheduleNotifications } from '@/providers/firefly/endpoint/getScheduleNotifications.js';
import { getTipsNotifications } from '@/providers/firefly/endpoint/getTipsNotifications.js';
import type { Notification } from '@/providers/types/SocialMedia.js';
import { listenNotifications } from '@/services/listenNotifications.js';
import { useNotificationStateStore } from '@/store/useNotificationStore.js';

export const FireflyNotifications = memo(function FireflyNotifications() {
    const allProfiles = useCurrentProfilesAll();
    const isLogin = useIsLoginFirefly();
    const typesState = useNotificationStateStore();
    const notificationSources = useNotificationSources();

    const { types, enableQualityFilter } = typesState[Source.Notifications];

    const unifiedAPITypes = useMemo(() => {
        const hasReactionLike = types.includes(NotificationType.Reaction);
        if (hasReactionLike) return UNIFIED_NOTIFICATION_TYPES;
        const selectedUnifiedTypes = types.filter((type): type is NotificationType =>
            UNIFIED_NOTIFICATION_TYPES.includes(type as NotificationType),
        );

        return selectedUnifiedTypes;
    }, [types]);

    const querySources = useMemo(() => {
        const sources: Array<'unified' | SocialSource | NotificationType> = [];

        const socialMediaTypes = types.filter((type): type is NotificationType =>
            SOCIAL_NOTIFICATION_TYPES.includes(type as NotificationType),
        );
        const needsTips = types.length === 0 || types.includes(NotificationType.Tips);
        const needsSchedule = types.length === 0 || types.includes(NotificationType.Schedule);
        const socialSources = notificationSources.filter((source) => source !== Source.Notifications);

        if (types.length === 0) {
            return [
                ...socialSources.filter((x) => !!allProfiles[x]?.profileId),
                NotificationType.Tips,
                NotificationType.Schedule,
                'unified',
            ];
        }

        if (unifiedAPITypes.length > 0) {
            sources.push('unified');
        }

        if (socialMediaTypes.length > 0) {
            sources.push(...socialSources.filter((x) => !!allProfiles[x]?.profileId));
        }

        if (needsTips) {
            sources.push(NotificationType.Tips);
        }

        if (needsSchedule) {
            sources.push(NotificationType.Schedule);
        }
        return sources;
    }, [types, allProfiles, unifiedAPITypes, notificationSources]);

    const queryResult = useMultiInfiniteQueryPageable(
        ['notifications', Source.Notifications, isLogin, enableQualityFilter, ...querySources],
        querySources.map((x) => ({
            key: x,
            queryFn: async ({ pageParam }) => {
                const indicator = createIndicator(undefined, pageParam);
                if (!isLogin) return createPageable(EMPTY_LIST, indicator);

                if (x === 'unified') {
                    return getAllNotifications(
                        unifiedAPITypes.length > 0 ? (unifiedAPITypes as string[]) : undefined,
                        indicator,
                    );
                }

                if (x === NotificationType.Tips) return getTipsNotifications(indicator);
                if (x === NotificationType.Schedule) return getScheduleNotifications(indicator);

                return resolveSocialMediaProvider(x as SocialSource).getNotifications(enableQualityFilter, indicator);
            },
        })),
        (data) => {
            updateNotificationReadStatus();
            listenNotifications();

            const list = data.pages.flatMap((page) =>
                page.data.concat().sort((a: Notification, b: Notification) => {
                    return (b.timestamp ?? 0) - (a.timestamp ?? 0);
                }),
            );

            if (!types.length) return list;
            return list.filter((x) => types.includes(x.type));
        },
    );

    if (!queryResult.isFetchingNextPage && queryResult.isFetching) {
        return <Loading />;
    }

    return (
        <ListInPage
            source={Source.Notifications}
            key={Source.Notifications}
            queryResult={queryResult}
            loginRequired
            VirtualListProps={{
                listKey: `${ScrollListKey.Notification}:${Source.Notifications}`,
                computeItemKey: (index, notification) => `${notification.notificationId}-${index}`,
                itemContent: getNotificationItemContent,
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
});
