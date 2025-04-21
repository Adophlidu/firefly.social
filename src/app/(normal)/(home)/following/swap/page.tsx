import { NoSSR } from '@/components/NoSSR.js';
import { SwapTimeline } from '@/components/Swap/SwapTimeline.js';

export default function Swap() {
    return (
        <NoSSR>
            <SwapTimeline isFollowing />
        </NoSSR>
    );
}
