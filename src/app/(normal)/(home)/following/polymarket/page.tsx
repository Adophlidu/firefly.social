import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FollowingPolymarketList } from '@/components/Polymarket/FollowingPolymarketList.js';

export default function FollowingPolymarketPage() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingPolymarketList />
            </Suspense>
        </NoSSR>
    );
}
