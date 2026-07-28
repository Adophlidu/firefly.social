import { type LoaderContext, useLoaderData } from '@dimensiondev/ssr';

import { EventsList } from '@/legacy/[locale]/(event)/events/EventsList.js';
import { getEventsListPageData } from '@/legacy/[locale]/(event)/events/getEventsListPageData.js';

export const config = { cache: { sMaxAge: 60 } };

interface EventsLoaderData {
    initialActivityListPage: Awaited<ReturnType<typeof getEventsListPageData>>;
}

export async function loader(_context: LoaderContext): Promise<EventsLoaderData> {
    const initialActivityListPage = await getEventsListPageData();
    return { initialActivityListPage };
}

export default function EventsPage() {
    const { initialActivityListPage } = useLoaderData<EventsLoaderData>();
    return <EventsList initialActivityListPage={initialActivityListPage} />;
}
