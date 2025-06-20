import { ForYouActivities } from '@/components/Activities/ForYouActivities.js';
import { NoSSR } from '@/components/NoSSR.js';

export default function Page() {
    return (
        <NoSSR>
            <ForYouActivities />
        </NoSSR>
    );
}
