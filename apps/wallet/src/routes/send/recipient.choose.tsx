import { lazy, Suspense } from 'react';

import { LoadingPanel } from '@/components/LoadingPanel.js';

const ChooseRecipientView = lazy(() =>
    import('@/components/SendTransactionModal/ChooseRecipientView.js').then((m) => ({
        default: m.ChooseRecipientView,
    })),
);

function LazyChooseRecipientView() {
    return (
        <Suspense fallback={<LoadingPanel />}>
            <ChooseRecipientView />
        </Suspense>
    );
}

export default LazyChooseRecipientView;
