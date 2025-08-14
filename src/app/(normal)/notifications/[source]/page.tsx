'use client';

import { first } from 'lodash-es';
import { use, useMemo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { NotificationItem } from '@/components/Notification/NotificationItem.js';
import { ScheduleNotificationItem } from '@/components/Notification/ScheduleNotificationItem.js';
import { TipsNotificationItem } from '@/components/Notification/TipsNotificationItem.js';
import { type NotificationSource, ScrollListKey, Source, SourceInURL } from '@/constants/enum.js';
import { EMPTY_LIST, SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsLoginNotifications } from '@/hooks/useIsLogin.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { type Notification as NotificationObject, NotificationType } from '@/providers/types/SocialMedia.js';
import { listenNotifications } from '@/services/listenNotifications.js';
import { useNotificationStateStore } from '@/store/useNotificationStore.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import type { NextPageProps } from '@/types/index.js';

const getNotificationItemContent = (index: number, notification: NotificationObject) => {
    if (notification.type === NotificationType.Tips) {
        return <TipsNotificationItem key={notification.notificationId} data={notification.data} />;
    }

    if (notification.type === NotificationType.Schedule) {
        return <ScheduleNotificationItem key={notification.notificationId} data={notification} />;
    }

    return <NotificationItem key={notification.notificationId} notification={notification} />;
};

function updateNotificationReadStatus() {
    const { setPreference } = usePreferencesState.getState();

    setPreference('NOTIFICATION_READ_RECORD', (prev) => {
        const entries = Object.entries(prev || {}).map(([type, records]) => {
            return [
                type,
                !Array.isArray(records)
                    ? []
                    : records.map((record) => ({
                          ...record,
                          hasNewNotification: false,
                      })),
            ];
        });
        return Object.fromEntries(entries);
    });
}

interface Props extends NextPageProps<{ source: SourceInURL }> {}

export default function Page(props: Props) {
    const params = use(props.params);
    const source = resolveSource(params.source) as NotificationSource;
    const isLogin = useIsLoginNotifications(source);
    const profilesAll = useCurrentProfilesAll();
    const asyncStatusAll = useAsyncStatusAll();

    const typesState = useNotificationStateStore();

    const { types, enableQualityFilter } = typesState[source];

    const querySources = useMemo(() => {
        if (source === Source.Notifications) {
            const firstType = first(types);
            if (firstType && types.length === 1 && firstType === NotificationType.Tips) {
                return [NotificationType.Tips] as const;
            }

            if (firstType && types.length === 1 && firstType === NotificationType.Schedule) {
                return [NotificationType.Schedule] as const;
            }
        }

        return [...SOCIAL_DISCOVER_SOURCE, NotificationType.Tips, NotificationType.Schedule] as const;
    }, [source, types]);

    const queryResult = useMultiInfiniteQueryPageable(
        ['notifications', source, isLogin, enableQualityFilter, asyncStatusAll],
        querySources
            .filter((x) => {
                if (source === Source.Notifications)
                    return x === NotificationType.Tips || x === NotificationType.Schedule ? isLogin : !!profilesAll[x];
                return x === source;
            })
            .map((x) => ({
                key: x,
                queryFn: async ({ pageParam }) => {
                    const indicator = createIndicator(undefined, pageParam);
                    if (!isLogin) return createPageable(EMPTY_LIST, indicator);

                    if (x === NotificationType.Tips) {
                        return FireflyEndpointProvider.getTipsNotifications(indicator);
                    }

                    if (x === NotificationType.Schedule) {
                        return FireflyEndpointProvider.getScheduleNotifications(indicator);
                    }

                    return resolveSocialMediaProvider(x).getNotifications(indicator, enableQualityFilter);
                },
            })),
        (data) => {
            updateNotificationReadStatus();
            listenNotifications();

            const list = data.pages.flatMap((page) =>
                page.data.concat().sort((a, b) => {
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
        <>
            <ListInPage
                source={source}
                key={source}
                queryResult={queryResult}
                loginRequired
                VirtualListProps={{
                    listKey: `${ScrollListKey.Notification}:${source}`,
                    computeItemKey: (index, notification) => `${notification.notificationId}-${index}`,
                    itemContent: getNotificationItemContent,
                }}
                NoResultsFallbackProps={{
                    className: 'md:pt-[228px] max-md:py-20',
                }}
            />
        </>
    );
}
