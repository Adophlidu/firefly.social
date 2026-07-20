import { lazy, Suspense } from 'react';

import { LoadingPanel } from '@/components/LoadingPanel.js';

const SearchRecipientView = lazy(() =>
    import('@/components/SendTransactionModal/SearchRecipientView.js').then((m) => ({
        default: m.SearchRecipientView,
    })),
);

function LazySearchRecipientView() {
    return (
        <Suspense fallback={<LoadingPanel />}>
            <SearchRecipientView />
        </Suspense>
    );
}

export default LazySearchRecipientView;
