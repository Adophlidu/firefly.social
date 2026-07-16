import betImageFallback from '@dimensiondev/assets/bet-image-fallback.svg?url';
import { formatPriceToCents, parseJson } from '@dimensiondev/utils';
import { formatTokenItemAmount } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { type PropsWithChildren, type ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PositionClaimModal } from '@/components/Bet/PositionClaimModal.js';
import { PositionShareSheet } from '@/components/Bet/PositionShare.js';
import { PositionShareEntrance } from '@/components/Bet/PositionShareEntrance.js';
import { Image } from '@/components/Image.js';
import { Skeleton } from '@/components/Skeleton.js';
import { Button } from '@/components/ui/button.js';
import { formatPercentRate } from '@/helpers/formatPercentRate.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { getPositionShareImagePayload } from '@/helpers/polymarketShareImage.js';
import { useLongPress } from '@/hooks/useLongPress.js';
import { usePolymarketShareIdentity } from '@/hooks/usePolymarketShareIdentity.js';
import { cn } from '@/lib/utils.js';
import { polymarketGammaEndpoint } from '@/providers/polymarket/gamma.js';
import type { PolymarketPosition } from '@/providers/types/Firefly.js';

export function PositionCard({ position, showAction = true }: { position: PolymarketPosition; showAction?: boolean }) {
    const navigate = useNavigate();
    const marketSlug = position.marketSlug;
    const eventSlug = position.event_slugs?.[0] ?? '';

    const [shareSheetOpen, setShareSheetOpen] = useState(false);
    const shareIdentity = usePolymarketShareIdentity(position.wallet || '');
    const sharePayload = getPositionShareImagePayload(position, shareIdentity);
    const longPressHandlers = useLongPress(() => {
        if (sharePayload) setShareSheetOpen(true);
    });

    // Fetch market data to get tokenIds for determining outcome index
    const { data: marketTokenIds, isLoading: isLoadingTokenIds } = useQuery({
        queryKey: ['polymarket-market-tokens', marketSlug, eventSlug, position.conditionId],
        queryFn: async () => {
            if (marketSlug) {
                const result = await polymarketGammaEndpoint.getMarketBySlug(marketSlug);
                if (result.ok && result.data?.clobTokenIds) {
                    return parseJson<string[]>(result.data.clobTokenIds) ?? [];
                }
            }
            if (eventSlug && position.conditionId) {
                const result = await polymarketGammaEndpoint.getEventBySlug(eventSlug);
                if (result.ok) {
                    const markets = result.data?.markets ?? [];
                    const matched = markets.find((m) => m?.conditionId === position.conditionId);
                    if (matched?.clobTokenIds) {
                        return parseJson<string[]>(matched.clobTokenIds) ?? [];
                    }
                }
            }
            return [];
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        enabled: Boolean(marketSlug || (eventSlug && position.conditionId)),
    });

    // Determine outcome index by comparing tokenId with market's tokenIds
    // Index 0 = positive outcome (green), Index 1 = negative outcome (red)
    // Returns null when still loading to avoid color flash
    const outcomeIndex = useMemo(() => {
        if (isLoadingTokenIds) return null;
        if (marketTokenIds && marketTokenIds.length > 0 && position.tokenId) {
            const index = marketTokenIds.indexOf(position.tokenId);
            if (index !== -1) return index;
        }
        // Fallback: index 0 for first token
        return 0;
    }, [marketTokenIds, position.tokenId, isLoadingTokenIds]);

    const buildSearch = useMemo(() => {
        return (side?: string) => {
            const params: Record<string, string> = {
                outcome: String(outcomeIndex ?? 0),
            };
            if (side) params.side = side;
            if (eventSlug) params.eventSlug = eventSlug;
            if (position.conditionId) params.conditionId = position.conditionId;
            return params;
        };
    }, [eventSlug, outcomeIndex, position.conditionId]);

    const resolveMarketSlug = async () => {
        if (marketSlug) return marketSlug;
        if (!eventSlug || !position.conditionId) return '';
        const result = await polymarketGammaEndpoint.getEventBySlug(eventSlug);
        if (!result.ok) return '';
        const markets = result.data?.markets ?? [];
        const matched = markets.find((m) => m?.conditionId === position.conditionId);
        return matched?.slug ?? '';
    };

    const navigateToSell = async () => {
        let nextSlug = marketSlug;
        if (!nextSlug && eventSlug) nextSlug = await resolveMarketSlug();
        if (!nextSlug) {
            toast.error(<Trans>Unable to open this market.</Trans>);
            return;
        }
        navigate({ to: `/bet/event/${encodeURIComponent(nextSlug)}`, search: buildSearch('sell') });
    };

    const navigateToDetail = async () => {
        let nextSlug = marketSlug;
        if (!nextSlug && eventSlug) nextSlug = await resolveMarketSlug();
        if (!nextSlug) return;
        navigate({ to: `/bet/event/${encodeURIComponent(nextSlug)}`, search: buildSearch() });
    };

    return (
        <div
            className="group w-full space-y-3 rounded-xl border border-line p-3"
            {...(sharePayload ? longPressHandlers : null)}
        >
            {sharePayload ? (
                <PositionShareSheet payload={sharePayload} open={shareSheetOpen} onOpenChange={setShareSheetOpen} />
            ) : null}
            <button type="button" className="w-full space-y-3 text-left" onClick={() => navigateToDetail()}>
                <div className="grid h-10 grid-cols-[40px_1fr] grid-rows-[40px] gap-2 text-sm font-semibold leading-5">
                    <div className="size-10 overflow-hidden rounded-lg bg-lightBg">
                        <Image
                            width={40}
                            height={40}
                            src={position.image}
                            alt={position.title}
                            fallback={betImageFallback}
                            className="size-full object-cover"
                        />
                    </div>
                    <div className="flex items-start gap-1">
                        <div className="line-clamp-2 min-w-0 flex-1">{position.title}</div>
                        {sharePayload ? (
                            <PositionShareEntrance
                                className="opacity-0 group-hover:opacity-100"
                                onClick={() => setShareSheetOpen(true)}
                            />
                        ) : null}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <Item field={<Trans>{formatTokenItemAmount(position.shares, 2)} shares</Trans>}>
                        <Skeleton className="h-5 w-10" isLoading={outcomeIndex === null}>
                            <span className={cn('font-bedstead', outcomeIndex === 0 ? 'text-success' : 'text-danger')}>
                                {position.vote_status}
                            </span>
                        </Skeleton>
                    </Item>
                    <Item
                        field={formatTokenUSD(BigNumber(position.shares).times(position.cur_price).toString(), {
                            minDisplay: 0.01,
                        })}
                    >
                        <span className={cn(position.pnl >= 0 ? 'text-success' : 'text-danger')}>
                            {position.pnl >= 0 ? '+' : ''}
                            {formatTokenUSD(position.pnl, { integerWhenGte1: true, minDisplay: 0.01 })}(
                            {formatPercentRate(position.pnl_rate)})
                        </span>
                    </Item>
                    <Item field={<Trans>Avg</Trans>}>{formatPriceToCents(position.avg_price, 1)}</Item>
                    <Item field={<Trans>Current</Trans>}>{formatPriceToCents(position.cur_price, 1)}</Item>
                </div>
            </button>
            {showAction && position.isClaimable && position.isWin ? (
                <PositionClaimModal position={position}>
                    <Button
                        size="lg"
                        className="w-full font-bold hover:bg-[#48AD3C]"
                        type="button"
                        colorPattern="success"
                    >
                        <Trans>Claim winnings</Trans>
                    </Button>
                </PositionClaimModal>
            ) : showAction && !position.isClaimable && !position.is_closed ? (
                <Button
                    size="lg"
                    className="w-full rounded-[10px] font-bold hover:bg-highlight"
                    colorPattern="purple"
                    type="button"
                    onClick={navigateToSell}
                >
                    <Trans>Sell</Trans>
                </Button>
            ) : null}
        </div>
    );
}

function Item({ field, children }: PropsWithChildren<{ field: ReactNode }>) {
    return (
        <div className="flex flex-col items-start">
            <div className="h-5 text-sm font-bold leading-5">{children}</div>
            <div className="text-xs text-second">{field}</div>
        </div>
    );
}
