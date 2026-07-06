import type { PageIndicator } from '@dimensiondev/utils';
import { useInfiniteQuery } from '@tanstack/react-query';
import { addDays, startOfDay } from 'date-fns';

import { getEventList } from '@/providers/calendar/getEventList.js';

export function useLumaEvents(date: Date) {
    const startTime = startOfDay(date).getTime();
    const endTime = addDays(startTime, 14).getTime();

    return useInfiniteQuery({
        queryKey: ['luma-events', startTime, endTime],
        initialPageParam: undefined as PageIndicator | undefined,
        queryFn: async ({ pageParam }) => {
            return getEventList(startTime, endTime, pageParam);
        },
        getNextPageParam(page) {
            return page.nextIndicator;
        },
        select(data) {
            return data.pages.flatMap((x) => x.data);
        },
    });
}
