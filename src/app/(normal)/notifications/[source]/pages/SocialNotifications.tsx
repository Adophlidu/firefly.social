import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { getNotificationItemContent } from '@/app/(normal)/notifications/[source]/pages/getNotificationItemContent.js';
import { updateNotificationReadStatus } from '@/app/(normal)/notifications/[source]/pages/updateNotificationReadStatus.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { type NotificationSource, ScrollListKey, type Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { listenNotifications } from '@/services/listenNotifications.js';
import { useNotificationStateStore } from '@/store/useNotificationStore.js';

interface SocialNotificationsProps {
    source: Exclude<NotificationSource, Source.Notifications>;
}

export const SocialNotifications = memo<SocialNotificationsProps>(function SocialNotifications({ source }) {
    const profile = useCurrentProfile(source);
    const typesState = useNotificationStateStore();
    const asyncStatusAll = useAsyncStatusAll();

    const isLogin = !!profile?.profileId;
    const { types, enableQualityFilter } = typesState[source];

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['notifications', source, isLogin, enableQualityFilter, asyncStatusAll],
        initialPageParam: '',
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            if (!isLogin || asyncStatusAll) return createPageable(EMPTY_LIST, indicator);

            try {
                return await resolveSocialMediaProvider(source).getNotifications(indicator, enableQualityFilter);
            } catch {
                return createPageable(EMPTY_LIST, indicator);
            }
        },
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => {
            updateNotificationReadStatus();
            listenNotifications();

            const list = data.pages.flatMap((x) => x.data);
            if (!types.length) return list;
            return list.filter((x) => types.includes(x.type));
        },
    });

    if (asyncStatusAll || (!queryResult.isFetchingNextPage && queryResult.isFetching)) {
        return <Loading />;
    }

    return (
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
    );
});
