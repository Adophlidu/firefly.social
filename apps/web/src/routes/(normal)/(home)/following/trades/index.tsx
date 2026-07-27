import { Suspense } from 'react';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FollowingTransactions } from '@/components/Transactions/FollowingTransactions.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

/** Manages its own right column. */
export const sidebar = () => null;


export function head() {
    return fromNextMetadata(createSiteMetadata('/following/trades'));
}

export default function FollowingTransactionsPage() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingTransactions />
            </Suspense>
        </NoSSR>
    );
}
