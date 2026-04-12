import { EMPTY_LIST } from '@dimensiondev/constants';
import urlcat from 'urlcat';

import { CALENDAR_BASE_URL } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { EventDatesResponse, EventProvider } from '@/types/calendar.js';

export async function getAvailableDates(type: EventProvider, start_date: number, end_date: number) {
    const response = await fetchJson<EventDatesResponse>(
        urlcat(CALENDAR_BASE_URL, 'crypto_event_date_list', {
            provider_type: type,
            start_date: start_date / 1000,
            end_date: end_date / 1000,
        }),
    );
    return (response.data || EMPTY_LIST).map((x) => x * 1000);
}
