import { CalendarCardSkeleton } from '@/components/Calendar/CalendarCardSkeleton.js';
import { dynamic } from '@/esm/dynamic.js';

const CalendarCard = dynamic(() => import('@/components/Calendar/CalendarCard.js').then((m) => m.CalendarCard), {
    ssr: false,
    loading: () => <CalendarCardSkeleton />,
});

export function Calendar() {
    return <CalendarCard />;
}
