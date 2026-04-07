import { createFileRoute } from '@tanstack/react-router';
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

export const Route = createFileRoute('/send/recipient/choose')({
    component: LazyChooseRecipientView,
});
