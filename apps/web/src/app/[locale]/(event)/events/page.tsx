import { EventsList } from '@/app/[locale]/(event)/events/EventsList.js';
import { getEventsListPageData } from '@/app/[locale]/(event)/events/getEventsListPageData.js';

export const revalidate = 60;

export default async function Page() {
    const initialActivityListPage = await getEventsListPageData();

    return <EventsList initialActivityListPage={initialActivityListPage} />;
}
