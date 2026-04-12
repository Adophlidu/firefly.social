import { parseJson } from '@dimensiondev/utils';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { BetError } from '@/components/Bet/BetError.js';
import { PositionClaimModal } from '@/components/Bet/PositionClaimModal.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import type { PolymarketPosition } from '@/providers/types/Firefly.js';

const PositionAction = {
    CLAIM_PROCEEDS: 'claim-proceeds',
    CLOSE_LOST_POSITION: 'close-lost-position',
} as const;

const positionSearchSchema = z
    .object({
        // Position can be a JSON string (from direct URL) or already parsed object (from router)
        position: z.unknown().optional(),
        action: z.string().optional(),
    })
    .passthrough();

export const Route = createFileRoute('/bet/position')({
    component: PositionPage,
    pendingComponent: LoadingPanel,
    errorComponent: BetError,
    validateSearch: positionSearchSchema,
});

function PositionPage() {
    return (
        <Suspense fallback={<LoadingPanel />}>
            <PositionContent />
        </Suspense>
    );
}

function PositionContent() {
    const navigate = useNavigate();
    const search = useSearch({ from: '/bet/position' });
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Parse position from search params
    // Position can be a JSON string (direct URL) or already parsed object (from router navigation)
    const position = useMemo(() => {
        if (!search.position) return null;
        if (typeof search.position === 'string') {
            return parseJson<PolymarketPosition>(search.position) || null;
        }
        // Already an object (parsed by router/urlcat)
        return search.position as PolymarketPosition;
    }, [search.position]);

    const action = search.action;

    const isValidAction = useMemo(() => {
        if (!position || !action) return false;
        return (
            (action === PositionAction.CLAIM_PROCEEDS && Boolean(position.isWin)) ||
            (action === PositionAction.CLOSE_LOST_POSITION && !position.isWin)
        );
    }, [position, action]);

    const handleClose = () => {
        navigate({ to: '/bet' });
    };

    useEffect(() => {
        // Wait for client-side mount before checking validity
        if (!hasMounted) return;

        // If no valid position/action after hydration, redirect to bet home
        if (!position || !isValidAction) {
            navigate({ to: '/bet' });
        }
    }, [hasMounted, position, isValidAction, navigate]);

    // Show loading until hydrated
    if (!hasMounted || !position || !isValidAction) {
        return <LoadingPanel />;
    }

    return <PositionClaimModal position={position} open onClose={handleClose} />;
}
