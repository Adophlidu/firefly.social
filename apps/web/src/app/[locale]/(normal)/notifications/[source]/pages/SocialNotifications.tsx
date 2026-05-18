import { EMPTY_LIST } from '@dimensiondev/constants';
import { type NotificationSource, ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator, createPageable } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { getNotificationItemContent } from '@/app/[locale]/(normal)/notifications/[source]/pages/getNotificationItemContent.js';
import { updateNotificationReadStatus } from '@/app/[locale]/(normal)/notifications/[source]/pages/updateNotificationReadStatus.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { mergeNotifications } from '@/helpers/mergeNotifications.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { listenNotifications } from '@/services/listenNotifications.js';
import { useNotificationStateStore } from '@/store/useNotificationStore.js';

interface SocialNotificationsProps {
    source: Exclude<NotificationSource, Source.Notifications>;
}

export const SocialNotifications = memo<SocialNotificationsProps>(function SocialNotifications({ source }) {
    const profile = useCurrentProfile(source);
    const typesState = useNotificationStateStore();

    const isLogin = !!profile?.profileId;
    const { types, enableQualityFilter } = typesState[source];

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['notifications', source, profile?.profileId, enableQualityFilter],
        initialPageParam: '',
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            if (!isLogin) return createPageable(EMPTY_LIST, indicator);

            try {
                return await resolveSocialMediaProvider(source).getNotifications(enableQualityFilter, indicator);
            } catch {
                return createPageable(EMPTY_LIST, indicator);
            }
        },
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => {
            updateNotificationReadStatus();
            listenNotifications();

            const list = data.pages.flatMap((x) => x.data);
            const filteredList = types.length ? list.filter((x) => types.includes(x.type)) : list;
            return source === Source.Twitter ? mergeNotifications(filteredList) : filteredList;
        },
    });

    if (!queryResult.isFetchingNextPage && queryResult.isFetching) {
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
