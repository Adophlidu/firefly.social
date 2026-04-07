import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod';

import { LoadingPanel } from '@/components/LoadingPanel.js';
import { ModalType } from '@/configs/modalRoutes.js';

const betSearchSchema = z
    .object({
        modal: z.nativeEnum(ModalType).optional(),
    })
    .passthrough();

export const Route = createFileRoute('/bet')({
    component: BetLayout,
    pendingComponent: LoadingPanel,
    validateSearch: betSearchSchema,
});

function BetLayout() {
    return <Outlet />;
}
