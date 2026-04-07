import { createFileRoute } from '@tanstack/react-router';

import { SuccessView } from '@/components/SendTransactionModal/SuccessView.js';

export const Route = createFileRoute('/send/success')({
    component: SuccessView,
});
