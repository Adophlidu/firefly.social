import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { z } from 'zod';

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

export const Route = createFileRoute('/send/recipients')({
    component: LazySearchRecipientView,
    validateSearch: z.object({
        keyword: z.string().optional(),
    }),
});
