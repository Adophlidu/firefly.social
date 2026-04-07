import { createFileRoute } from '@tanstack/react-router';

import { redirectToModal } from '@/configs/modalRoutes.js';

export const Route = createFileRoute('/bet/_home/export-key')({
    beforeLoad: () => redirectToModal('/bet/export-key'),
    component: () => null,
});
