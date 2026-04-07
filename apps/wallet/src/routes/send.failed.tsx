import { createFileRoute } from '@tanstack/react-router';

import { FailedView } from '@/components/SendTransactionModal/FailedView.js';

export const Route = createFileRoute('/send/failed')({
    component: FailedView,
});
