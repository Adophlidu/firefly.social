import { compact } from 'lodash-es';

import { formatEventDate } from '@/providers/calendar/formatEventDate.js';
import { type Event, type ParsedEvent } from '@/types/calendar.js';

interface LumaRawEvent {
    calendar: {
        geo_city: string;
        geo_country: string;
        geo_region: string;
    };
    event: {
        geo_address_info: {
            address: string;
            city: string;
            city_state: string;
            country: string;
            full_address: string;
            latitude: string;
            longitude: string;
            mode: string;
            place_id: string;
            region: string;
            type: string;
        };
    };
    hosts: Array<{
        avatar_url: string;
        name: string;
    }>;
}

export function formatEvent(event: Event): ParsedEvent {
    const rawEvent = event.raw_data ? (event.raw_data as LumaRawEvent) : null;
    if (!rawEvent) return formatEventDate(event);
    const host = rawEvent.hosts[0];
    return {
        ...event,
        event_date: +event.event_date * 1000,
        event_city: rawEvent.calendar.geo_city,
        event_country: rawEvent.calendar.geo_country,
        event_full_location:
            rawEvent.event.geo_address_info.full_address ||
            compact([rawEvent.calendar.geo_region, rawEvent.calendar.geo_city, rawEvent.calendar.geo_country]).join(
                ', ',
            ),
        host_name: host?.name,
        host_avatar: host?.avatar_url,
    };
}
