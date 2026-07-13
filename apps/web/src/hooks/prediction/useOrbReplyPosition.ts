'use client';

import { PredictionPlatform, Source } from '@dimensiondev/enums';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { useEffect, useMemo } from 'react';

import { getPredictionPositionList } from '@/components/Prediction/getPredictionPositionList.js';
import { STALE_TIMES } from '@/constants/query.js';
import type { Lpt1PositionInput } from '@/helpers/lpt1.js';
import {
    mapPositionToLpt1Input,
    pickLargestPosition,
    resolveMarketIdByConditionId,
} from '@/helpers/prediction/predictPositionToLpt1.js';
import { getAccountMarketPositions } from '@/providers/firefly/prediction/getAccountMarketPositions.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

export interface UseOrbReplyPositionOptions {
    eventSlug?: string;
    // null from PredictionContext; undefined while loading or for non-Orb posts.
    event?: BetsEventDataForUI | null;
}

/**
 * Resolve the current user's largest position in an Orb (LPT-1) event — attached
 * to a published Orb comment so its position pill renders.
 *
 * Sport events hold positions on a CHILD event, so we batch the parent id with
 * `sportData.childEventIds` (the parent id alone returns []). The largest
 * holding wins when the author is in several markets.
 *
 * Stays fresh after trades: the global query client has `refetchOnWindowFocus`
 * off, so we subscribe to the wallet `position-operation` event and invalidate
 * both queries — a just-placed order shows up before the user composes. Returns
 * `null` (no pill) when there's no event, wallet, or position.
 */
export function useOrbReplyPosition({ eventSlug, event }: UseOrbReplyPositionOptions): Lpt1PositionInput | null {
    const { currentProfileSession } = useFireflyProfileStore();
    const batchEventIds = useMemo(
        () => [event?.id, ...(event?.sportData?.childEventIds ?? [])].filter(Boolean) as string[],
        [event?.id, event?.sportData?.childEventIds],
    );

    // Distinct query key — the Positions tab still uses the conditionIds call.
    const { data: positionAccounts } = useQuery({
        queryKey: [
            Source.Prediction,
            'orb-comment-position-wallets',
            PredictionPlatform.Polymarket,
            batchEventIds.join(','),
            currentProfileSession?.profileId,
        ],
        enabled: !!currentProfileSession && batchEventIds.length > 0,
        queryFn: () => getAccountMarketPositions([], batchEventIds),
    });
    const proxyAddress = first(positionAccounts ?? [])?.proxy ?? '';
    const positionQuery = useQuery({
        queryKey: [Source.Prediction, 'orb-comment-user-position', eventSlug, proxyAddress],
        enabled: !!proxyAddress && batchEventIds.length > 0,
        queryFn: () =>
            getPredictionPositionList(PredictionPlatform.Polymarket, {
                address: proxyAddress,
                eventId: batchEventIds.join(','),
                isProxyAddress: true,
                positionType: 'current',
            }),
        staleTime: STALE_TIMES.MINUTE_5,
    });

    // Mirrors PredictionProfilePositionList — refresh on trade (refetchOnWindowFocus is off).
    const queryClient = useQueryClient();
    const subscribeToWalletEvents = useGlobalState((state) => state.subscribeToWalletEvents);
    useEffect(() => {
        if (batchEventIds.length === 0) return; // non-event surfaces pay nothing
        const unsubscribe = subscribeToWalletEvents('position-operation', () => {
            queryClient.invalidateQueries({ queryKey: [Source.Prediction, 'orb-comment-position-wallets'] });
            queryClient.invalidateQueries({ queryKey: [Source.Prediction, 'orb-comment-user-position'] });
        });
        return unsubscribe;
    }, [batchEventIds.length, queryClient, subscribeToWalletEvents]);

    return useMemo(() => {
        const largest = pickLargestPosition(positionQuery.data?.data ?? []);
        if (!largest) return null;
        const input = mapPositionToLpt1Input(largest);
        // Best-effort deep-link marketId (parity with iOS); omitted if the market isn't in the event.
        const marketId = resolveMarketIdByConditionId(largest.conditionId, event?.markets);
        return marketId ? { ...input, marketId } : input;
    }, [positionQuery.data?.data, event?.markets]);
}
