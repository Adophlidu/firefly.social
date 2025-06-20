import { FollowingActivities } from '@/components/Activities/FollowingActivities.js';
import { NoSSR } from '@/components/NoSSR.js';

export default function Activities() {
    return (
        <NoSSR>
            <FollowingActivities />
        </NoSSR>
    );
}
