import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { z } from 'zod';

import { V2UpgradeCheck } from '@/components/Bet/V2UpgradeCheck.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { ModalType } from '@/configs/modalRoutes.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';

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
    useEffect(() => {
        captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_EXPLORE_BETS_OPEN_SUCCESS, {});
    }, []);

    return (
        <V2UpgradeCheck>
            <Outlet />
        </V2UpgradeCheck>
    );
}
