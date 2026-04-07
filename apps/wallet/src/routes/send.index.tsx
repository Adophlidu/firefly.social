import { createFileRoute, redirect } from '@tanstack/react-router';

import { RoutePath } from '@/components/SendTransactionModal/types.js';

export const Route = createFileRoute('/send/')({
    beforeLoad: () => {
        throw redirect({ to: RoutePath.SelectToken, replace: true });
    },
});
