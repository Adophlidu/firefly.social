import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FollowingTransactions } from '@/components/Transactions/FollowingTransactions.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/following/trades');

export default function TransactionsPage() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingTransactions />
            </Suspense>
        </NoSSR>
    );
}
