import { useInfiniteQuery } from '@tanstack/react-query';
import { addDays, startOfDay } from 'date-fns';
import { uniqBy } from 'lodash-es';

import { getNewsList } from '@/providers/calendar/getNewsList.js';

export function useNewsList(date: Date) {
    const startTime = startOfDay(date).getTime();
    const endTime = addDays(startTime, 14).getTime();

    return useInfiniteQuery({
        queryKey: ['calendar-news', startTime, endTime],
        queryFn: ({ pageParam }) => getNewsList(startTime, endTime, pageParam),
        initialPageParam: undefined as any,
        getNextPageParam: (page) => page.nextIndicator,
        select(data) {
            return uniqBy(
                data.pages.flatMap((x) => x.data),
                (x) => x.event_id,
            );
        },
    });
}
