import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { ForYouTransactions } from '@/components/Transactions/ForYouTransactions.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/transactions');

export default function Page() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <ForYouTransactions />
            </Suspense>
        </NoSSR>
    );
}
