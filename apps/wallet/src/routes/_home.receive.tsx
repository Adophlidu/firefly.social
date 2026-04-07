import { createFileRoute } from '@tanstack/react-router';

import { redirectToModal } from '@/configs/modalRoutes.js';

export const Route = createFileRoute('/_home/receive')({
    beforeLoad: () => redirectToModal('/receive'),
    component: () => null,
});
