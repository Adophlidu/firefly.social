import { first } from 'lodash-es';
import { memo, useMemo } from 'react';

import { getNotificationItemContent } from '@/app/(normal)/notifications/[source]/pages/getNotificationItemContent.js';
import { updateNotificationReadStatus } from '@/app/(normal)/notifications/[source]/pages/updateNotificationReadStatus.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { EMPTY_LIST, SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { NotificationType } from '@/providers/types/SocialMedia.js';
import { listenNotifications } from '@/services/listenNotifications.js';
import { useNotificationStateStore } from '@/store/useNotificationStore.js';

export const FireflyNotifications = memo(function FireflyNotifications() {
    const allProfiles = useCurrentProfilesAll();
    const isLogin = useIsLoginFirefly();
    const typesState = useNotificationStateStore();
    const asyncStatusAll = useAsyncStatusAll();

    const { types, enableQualityFilter } = typesState[Source.Notifications];

    const querySources = useMemo(() => {
        const firstType = first(types);
        if (firstType && types.length === 1 && firstType === NotificationType.Tips) {
            return [NotificationType.Tips] as const;
        }

        if (firstType && types.length === 1 && firstType === NotificationType.Schedule) {
            return [NotificationType.Schedule] as const;
        }

        return [
            ...SOCIAL_DISCOVER_SOURCE.filter((x) => !!allProfiles[x]?.profileId),
            NotificationType.Tips,
            NotificationType.Schedule,
        ] as const;
    }, [types, allProfiles]);
    const queryResult = useMultiInfiniteQueryPageable(
        ['notifications', Source.Notifications, isLogin, enableQualityFilter, asyncStatusAll, ...querySources],
        querySources.map((x) => ({
            key: x,
            queryFn: async ({ pageParam }) => {
                const indicator = createIndicator(undefined, pageParam);
                if (!isLogin || asyncStatusAll) return createPageable(EMPTY_LIST, indicator);

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

    if (asyncStatusAll || (!queryResult.isFetchingNextPage && queryResult.isFetching)) {
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
