import { NoSSR } from '@/components/NoSSR.js';
import { PolymarketTimeLine } from '@/components/Polymarket/PolymarketTimeLine.js';

export default function Bets() {
    return (
        <NoSSR>
            <PolymarketTimeLine isFollowing />
        </NoSSR>
    );
}
