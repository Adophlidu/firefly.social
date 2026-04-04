import { EventsList } from '@/app/[locale]/(event)/events/EventsList.js';

export const revalidate = 60;

export default function Page() {
    return <EventsList />;
}
