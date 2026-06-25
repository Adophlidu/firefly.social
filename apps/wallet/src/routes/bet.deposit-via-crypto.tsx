import { createFileRoute } from '@tanstack/react-router';

import { redirectToModal } from '@/configs/modalRoutes.js';

export const Route = createFileRoute('/bet/deposit-via-crypto')({
    beforeLoad: () => redirectToModal('/bet/deposit-via-crypto'),
    component: () => null,
});
