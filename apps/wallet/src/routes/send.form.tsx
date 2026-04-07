import { createFileRoute } from '@tanstack/react-router';

import { FormView } from '@/components/SendTransactionModal/FormView.js';

export const Route = createFileRoute('/send/form')({
    component: FormView,
});
