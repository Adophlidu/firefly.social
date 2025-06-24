import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { ForYouTransactions } from '@/components/Transactions/ForYouTransactions.js';

export default function Page() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <ForYouTransactions />
            </Suspense>
        </NoSSR>
    );
}
