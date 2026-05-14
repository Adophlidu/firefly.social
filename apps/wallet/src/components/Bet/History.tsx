import ArchiveIcon from '@dimensiondev/assets/archive.svg';
import BetHistoryEmptyIcon from '@dimensiondev/assets/bet-history-empty.svg';
import betImageFallback from '@dimensiondev/assets/bet-image-fallback.svg?url';
import WonIcon from '@dimensiondev/assets/polymarket-claim.svg';
import LostIcon from '@dimensiondev/assets/polymarket-lost.svg';
import WarnIcon from '@dimensiondev/assets/warn.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { formatPriceToCents, removeTrailingZeros } from '@dimensiondev/utils';
import { waitForEthereumTransaction } from '@dimensiondev/web3/actions';
import { Plural, Trans } from '@lingui/react/macro';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMutation, useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import dayjs from 'dayjs';
import { compact } from 'lodash-es';
import { ArrowDown, ArrowUp, ChevronDown, X } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { type Address, formatUnits, type Hash, parseUnits } from 'viem';
import { polygon } from 'viem/chains';
import { useConfig } from 'wagmi';

import { BetEmptyState } from '@/components/Bet/BetEmptyState.js';
import {
    DialogOrDrawer,
    DialogOrDrawerClose,
    DialogOrDrawerContent,
    DialogOrDrawerTitle,
    DialogOrDrawerTrigger,
} from '@/components/DialogOrDrawer.js';
import { Image } from '@/components/Image.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Button } from '@/components/ui/button.js';
import { formatDate } from '@/helpers/formatDate.js';
import { formatPercentRate } from '@/helpers/formatPercentRate.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { formatTokenItemAmount } from '@/helpers/formatTokenItemAmount.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { useLocale } from '@/helpers/getCookies.js';
import { computeClaimAmount } from '@/helpers/polymarketClaim.js';
import { getPositionsQueryKeys } from '@/helpers/polymarketPositionsCache.js';
import { useSignMessageWithPrivy } from '@/hooks/useSignMessageWithPrivy.js';
import { cn } from '@/lib/utils.js';
import {
    mapPolymarketV2ToLegacy,
    type PolymarketActivityItem,
    type PolymarketActivityMarketAction,
    type PolymarketClaimV2Item,
    type PolymarketPosition,
    type PolymarketV2PositionSortBy,
} from '@/providers/types/Firefly.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import { store } from '@/store/index.js';

const PAGE_SIZE = 20;

enum HistoryTab {
    ClosedPositions = 'closed-positions',
    TradingActivities = 'trading-activities',
}

type ClosedPositionSortBy = Extract<PolymarketV2PositionSortBy, 'TIMESTAMP' | 'REALIZEDPNL' | 'AVGPRICE' | 'TITLE'>;

const CLOSED_POSITION_SORT_OPTIONS: Array<{ value: ClosedPositionSortBy; label: React.ReactNode }> = [
    { value: 'TIMESTAMP', label: <Trans>Date</Trans> },
    { value: 'REALIZEDPNL', label: <Trans>PnL</Trans> },
    { value: 'AVGPRICE', label: <Trans>Avg Price</Trans> },
    { value: 'TITLE', label: <Trans>Alphabetically</Trans> },
];

function HistoryTabButton({
    active,
    children,
    onClick,
}: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={cn(
                'flex min-w-0 items-center justify-center border-b-[2.5px] px-1 text-base font-semibold leading-6',
                active ? 'border-main text-main' : 'text-second border-transparent',
            )}
            onClick={onClick}
        >
            <span className="truncate">{children}</span>
        </button>
    );
}

export function History() {
    const [tab, setTab] = useState<HistoryTab>(HistoryTab.ClosedPositions);

    return (
        <div className="w-full">
            <div className="bg-primaryBottom sticky top-0 z-10 px-4">
                <div className="grid h-9 grid-cols-2">
                    <HistoryTabButton
                        active={tab === HistoryTab.ClosedPositions}
                        onClick={() => setTab(HistoryTab.ClosedPositions)}
                    >
                        <Trans>Closed Positions</Trans>
                    </HistoryTabButton>
                    <HistoryTabButton
                        active={tab === HistoryTab.TradingActivities}
                        onClick={() => setTab(HistoryTab.TradingActivities)}
                    >
                        <Trans>Trading Activities</Trans>
                    </HistoryTabButton>
                </div>
            </div>
            {tab === HistoryTab.ClosedPositions ? <ClosedPositionsHistory /> : <TradingActivitiesHistory />}
        </div>
    );
}

function ClosedPositionsHistory() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const [sortBy, setSortBy] = useState<ClosedPositionSortBy>('TIMESTAMP');
    const proxyAddress = account.proxyAddress;
    const proxy = proxyAddress.toLowerCase();

    // Keyed on proxy only — changing sortBy won't trigger a re-fetch of these 200 items
    const { data: redeemablePositions = [] } = useSuspenseQuery({
        queryKey: ['polymarket-history-redeemable', proxy],
        async queryFn() {
            const positions = await getFireflyEndpoint().getPolymarketV2CurrentPositions(proxyAddress, {
                redeemable: true,
                offset: 0,
                limit: 200,
            });
            return (positions ?? []).map((p) => mapPolymarketV2ToLegacy(p, false)).filter((x) => x.shares > 0);
        },
        staleTime: 30_000,
    });

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket-history-closed-positions', proxy, sortBy],
        initialPageParam: 0,
        async queryFn({ pageParam }) {
            const offset = pageParam as number;
            const closedPositions = await getFireflyEndpoint().getPolymarketV2ClosedPositions(proxyAddress, {
                offset,
                limit: PAGE_SIZE,
                sortBy,
                sortDirection: 'DESC',
            });
            return {
                data: (closedPositions ?? []).map((p) => mapPolymarketV2ToLegacy(p, true)).filter((x) => x.shares > 0),
                nextOffset:
                    (closedPositions?.length ?? 0) >= PAGE_SIZE ? offset + (closedPositions?.length ?? 0) : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        select: (data) => data.pages.flatMap((p) => p.data || []),
    });

    const positions = useMemo(() => {
        if (!redeemablePositions.length) return queryResult.data;
        if (!queryResult.data?.length) return redeemablePositions;
        return sortClosedPositions(dedupePositions([...redeemablePositions, ...(queryResult.data || [])]), sortBy);
    }, [redeemablePositions, queryResult.data, sortBy]);
    const closeableLosses = useMemo(
        () => positions.filter((position) => position.isClaimable && !position.isWin && !position.is_closed),
        [positions],
    );

    return (
        <div className="w-full pb-8">
            {positions.length ? (
                <div className="flex items-center justify-between gap-3 px-4 pt-4">
                    {closeableLosses.length ? (
                        <CloseLossesDialog proxyAddress={proxyAddress} positions={closeableLosses}>
                            <button
                                type="button"
                                className="border-line text-main flex h-9 items-center gap-1 rounded-2xl border px-4 text-sm font-medium leading-[18px]"
                            >
                                <ArchiveIcon className="size-3.5" />
                                <Trans>Close all the losses</Trans>
                            </button>
                        </CloseLossesDialog>
                    ) : null}
                    <ClosedPositionSortDialog value={sortBy} onValueChange={setSortBy} />
                </div>
            ) : null}

            <ListInPage<PolymarketPosition>
                queryResult={{ ...queryResult, data: positions }}
                VirtualListProps={{
                    listKey: `polymarket-history-closed-positions:${proxy}:${sortBy}`,
                    computeItemKey: getPositionKey,
                    itemContent: getClosedPositionContent,
                    context: {
                        footerText: <Trans>No more positions</Trans>,
                    },
                }}
                NoResultsFallbackProps={{
                    className: 'px-4',
                    icon: <BetHistoryEmptyIcon className="text-third h-[128px] w-[160px]" />,
                    message: <BetEmptyState message={<Trans>No positions found</Trans>} />,
                }}
            />
        </div>
    );
}

function TradingActivitiesHistory() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const proxy = account.proxyAddress.toLowerCase();
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket-user-activity', proxy],
        initialPageParam: undefined as undefined | string,
        async queryFn({ pageParam }) {
            return getFireflyEndpoint().getPolymarketUserActivity({
                proxyWallet: proxy,
                cursor: pageParam,
            });
        },
        getNextPageParam: (lastPage) => {
            return lastPage?.cursor ?? undefined;
        },
        select: (data) => {
            return data.pages.flatMap((page) => page.result || []);
        },
    });

    return (
        <ListInPage<PolymarketActivityItem>
            queryResult={queryResult}
            className="mb-8"
            VirtualListProps={{
                listKey: `polymarket-history`,
                computeItemKey: (index, item) => `${item.transactionHash}-${index}`,
                itemContent: getActivityContent,
                context: {
                    footerText: <Trans>No more history</Trans>,
                },
            }}
            NoResultsFallbackProps={{
                className: 'px-4',
                icon: <BetHistoryEmptyIcon className="text-third h-16 w-20" />,
                message: <BetEmptyState message={<Trans>No activities found</Trans>} />,
            }}
        />
    );
}

function ClosedPositionSortDialog({
    value,
    onValueChange,
}: {
    value: ClosedPositionSortBy;
    onValueChange: (value: ClosedPositionSortBy) => void;
}) {
    const [open, setOpen] = useState(false);
    const selectedOption = CLOSED_POSITION_SORT_OPTIONS.find((option) => option.value === value);

    return (
        <DialogOrDrawer open={open} onOpenChange={setOpen}>
            <DialogOrDrawerTrigger asChild>
                <button
                    type="button"
                    className="border-line text-main ml-auto flex h-9 items-center gap-1.5 rounded-2xl border px-3 text-sm leading-[18px]"
                >
                    <span>{selectedOption?.label}</span>
                    <ChevronDown className="size-3.5" />
                </button>
            </DialogOrDrawerTrigger>
            <DialogOrDrawerContent className="w-full rounded-t-[36px] px-4 pb-4 pt-2" bodyClassName="px-4 pb-4 pt-2">
                <VisuallyHidden asChild>
                    <DialogOrDrawerTitle>
                        <Trans>Sort closed positions</Trans>
                    </DialogOrDrawerTitle>
                </VisuallyHidden>
                <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[#d1d1d1]" />
                <div className="flex flex-col gap-2">
                    {CLOSED_POSITION_SORT_OPTIONS.map((option) => {
                        const active = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                className="text-main flex w-full items-center justify-between gap-2.5 p-2 text-left text-base font-semibold leading-6"
                                onClick={() => {
                                    onValueChange(option.value);
                                    setOpen(false);
                                }}
                            >
                                <span>{option.label}</span>
                                {active ? <WonIcon className="size-6" /> : null}
                            </button>
                        );
                    })}
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}

function getPositionKey(index: number, item: PolymarketPosition) {
    return item.Id || item.tokenId || item.conditionId || String(index);
}

function getClosedPositionContent(index: number, item: PolymarketPosition) {
    return (
        <div key={getPositionKey(index, item)} className="px-4 pt-4">
            <ClosedPositionCard position={item} />
        </div>
    );
}

function ClosedPositionCard({ position }: { position: PolymarketPosition }) {
    const totalBought = position.total_buy || position.shares;
    const totalTrade = BigNumber(position.avg_price).times(totalBought);
    const currentValue = position.current_value;
    const settlementValue =
        typeof currentValue === 'number' && Number.isFinite(currentValue)
            ? BigNumber(currentValue)
            : totalTrade.plus(position.pnl);
    const pnlRate = totalTrade.gt(0) ? BigNumber(position.pnl).div(totalTrade).toNumber() : position.pnl_rate;
    const isWon = position.pnl > 0;

    const navigateToDetail = () => {
        const eventSlug = position.event_slugs?.[0];
        if (!eventSlug) return;
        iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
            path: `/polymarket/event/${encodeURIComponent(eventSlug)}`,
        });
    };

    return (
        <div className="border-line w-full rounded-xl border p-4">
            <button type="button" className="flex w-full items-center gap-2 text-left" onClick={navigateToDetail}>
                <div className="bg-lightBg size-8 shrink-0 overflow-hidden rounded-md">
                    <Image
                        width={32}
                        height={32}
                        src={position.image}
                        alt={position.title}
                        fallback={betImageFallback}
                        className="size-full object-cover"
                    />
                </div>
                <div className="text-main line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-5">
                    {position.title || '-'}
                </div>
            </button>
            <div className="mt-3 flex items-center justify-between gap-6">
                <div className="flex min-w-0 items-center gap-1">
                    <span
                        className={cn(
                            'flex shrink-0 items-center gap-0.5 rounded-[10px] py-1 pl-1 pr-1.5 text-xs font-medium leading-[14px]',
                            isWon ? 'bg-[#DCF1D9] text-[#48AD3C]' : 'bg-[#FFE6E4] text-[#FF564D]',
                        )}
                    >
                        {isWon ? <WonIcon className="size-3.5" /> : <LostIcon className="size-3.5" />}
                        <span>{isWon ? <Trans>Won</Trans> : <Trans>Lost</Trans>}</span>
                    </span>
                    <span className="text-main truncate text-xs leading-[14px]">{position.vote_status || '-'}</span>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-center">
                    <div className="text-main text-sm font-semibold leading-5">
                        <Trans>{formatTokenItemAmount(totalBought, 2)} shares</Trans>
                    </div>
                    <div className="text-second text-xs leading-[14px]">
                        <Trans>Avg {formatPriceToCents(position.avg_price, 1)}</Trans>
                    </div>
                </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-6">
                <div className="flex min-w-0 flex-col">
                    <div
                        className={cn(
                            'truncate text-sm font-semibold leading-5',
                            isWon ? 'text-success' : 'text-danger',
                        )}
                    >
                        {formatSignedUSD(position.pnl)}({formatSignedPercent(pnlRate)})
                    </div>
                    <div className="text-second truncate text-xs leading-[14px]">
                        {formatTokenUSD(settlementValue.toString(), { minDisplay: 0.01 })}
                    </div>
                </div>
                <div className="flex min-w-0 flex-col items-end">
                    <div className="text-main text-sm font-semibold leading-5">
                        {formatTokenUSD(totalTrade.toString())}
                    </div>
                    <div className="text-second text-xs leading-[14px]">
                        <Trans>Total traded</Trans>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CloseLossesDialog({
    proxyAddress,
    positions,
    children,
}: {
    proxyAddress: Address;
    positions: PolymarketPosition[];
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const config = useConfig();
    const queryClient = useQueryClient();
    const signMessage = useSignMessageWithPrivy();
    const proxy = proxyAddress.toLowerCase();
    const claimItems = useMemo(() => compact(positions.map(toClaimItem)), [positions]);

    const { mutate, isPending } = useMutation({
        mutationKey: ['polymarket-close-losses', proxy],
        async mutationFn() {
            store.set(showEmbeddedWalletUIAtom, false);
            // Bind the signed message to the specific claim payload so it can't be replayed
            const conditionIds = claimItems
                .map((item) => item.condition_id)
                .sort()
                .join(':');
            const originalMessage = `polymarket claim proceed:${conditionIds}`;
            const signature = await signMessage(originalMessage);
            const data = await getFireflyEndpoint().polymarketBatchClaimV2({
                items: claimItems,
                original_message: originalMessage,
                signature_message: signature,
            });
            await waitForEthereumTransaction(config, polygon.id, data.hash as Hash);
            return data;
        },
        async onSuccess() {
            setOpen(false);
            const positionsQueryKeys = getPositionsQueryKeys(proxyAddress);
            await Promise.all([
                queryClient.refetchQueries({ queryKey: positionsQueryKeys.current, exact: true, type: 'all' }),
                queryClient.refetchQueries({ queryKey: positionsQueryKeys.closed, exact: true, type: 'all' }),
                queryClient.invalidateQueries({ queryKey: ['polymarket-history-redeemable', proxy] }),
                queryClient.invalidateQueries({ queryKey: ['polymarket-history-closed-positions', proxy] }),
                queryClient.invalidateQueries({ queryKey: ['polymarket-claimable-proceeds', proxy] }),
                queryClient.invalidateQueries({ queryKey: ['polymarket-user-activity', proxy] }),
            ]);
            iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NOTIFY, {
                type: 'position-operation',
                data: { action: 'close-losses', address: proxyAddress },
            });
        },
        onError(error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(<Trans>Failed to close losses</Trans>, { description: message });
        },
        onSettled() {
            store.set(showEmbeddedWalletUIAtom, true);
        },
    });

    return (
        <DialogOrDrawer
            open={open}
            onOpenChange={(v) => {
                if (!isPending) setOpen(v);
            }}
        >
            <DialogOrDrawerTrigger asChild>{children}</DialogOrDrawerTrigger>
            <DialogOrDrawerContent className="w-full gap-6 rounded-t-2xl p-6" bodyClassName="gap-6 p-0">
                <div className="flex w-full items-center justify-between gap-4">
                    <DialogOrDrawerTitle className="text-main text-left text-xl font-bold leading-6">
                        <Trans>Close all the losses</Trans>
                    </DialogOrDrawerTitle>
                    <DialogOrDrawerClose asChild>
                        <button type="button" className="text-main shrink-0 rounded p-1">
                            <X className="size-6" />
                            <span className="sr-only">Close</span>
                        </button>
                    </DialogOrDrawerClose>
                </div>
                <div className="flex min-h-0 flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <div className="bg-second/60 text-primaryBottom flex items-center justify-center rounded-full">
                            <WarnIcon width={64} height={64} className="text-third" />
                        </div>
                        <div className="text-main text-center text-base font-semibold leading-6">
                            <Trans>Missed this round</Trans>
                        </div>
                        <div className="text-second text-center text-sm leading-[18px]">
                            <Trans>Better luck on the next prediction.</Trans>
                        </div>
                    </div>

                    <div className="no-scrollbar flex max-h-[280px] min-h-0 w-full flex-col gap-3 overflow-auto px-2">
                        {positions.map((position) => (
                            <div key={getPositionKey(0, position)} className="flex items-center gap-2">
                                <div className="bg-lightBg size-10 shrink-0 overflow-hidden rounded-lg">
                                    <Image
                                        width={40}
                                        height={40}
                                        src={position.image}
                                        alt={position.title}
                                        fallback={betImageFallback}
                                        className="size-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-second line-clamp-1 text-sm font-semibold leading-5">
                                        {position.title || '-'}
                                    </div>
                                    <div className="text-main text-base font-bold leading-6">
                                        <Trans>Lost {formatPnlUSD(getPositionLoss(position))}</Trans>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {claimItems.length < positions.length ? (
                        <div className="text-warn text-center text-sm leading-[18px]">
                            <Trans>
                                {claimItems.length} of {positions.length} positions will be closed
                            </Trans>
                        </div>
                    ) : null}
                    <Button
                        type="button"
                        size="lg"
                        variant="primary"
                        className="h-10 w-full shrink-0 rounded-full font-bold"
                        loading={isPending}
                        disabled={isPending || !claimItems.length}
                        onClick={() => mutate()}
                    >
                        <Trans>Close losses</Trans>
                    </Button>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}

function getActivityContent(index: number, item: PolymarketActivityItem) {
    return <HistoryItem key={`${item.transactionHash}-${index}`} item={item} />;
}

function HistoryItem({ item }: { item: PolymarketActivityItem }) {
    const locale = useLocale();
    const whenRelative = formatDate(dayjs.unix(item.timestamp), 'shortDate', locale);

    const priceCents = useMemo(() => {
        const price = getTradeActivity(item)?.price;
        if (price === undefined) return '-';
        const bn = BigNumber(price);
        if (!bn.isFinite()) return '-';
        return `${removeTrailingZeros(bn.times(100).decimalPlaces(1, BigNumber.ROUND_HALF_UP).toFixed(1))}¢`;
    }, [item]);

    const navigateToDetail = (eventSlug: string) => {
        iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
            path: `/polymarket/event/${encodeURIComponent(eventSlug)}`,
        });
    };

    if (item.type === 'deposit' || item.type === 'withdraw') {
        const isIn = item.type === 'deposit';
        const amount = parseUsdcAmount(item.depositWithdraw?.amount);
        return (
            <HistoryCard>
                <div className="flex items-center gap-2">
                    <div className="bg-lightBg flex size-10 items-center justify-center rounded-lg">
                        {isIn ? <ArrowDown width={20} height={20} /> : <ArrowUp width={20} height={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-main truncate text-sm font-bold leading-5">
                            {isIn ? <Trans>Add Funds</Trans> : <Trans>Withdraw</Trans>}
                        </div>
                        <div className="text-second text-xs leading-[14px]">{whenRelative}</div>
                    </div>
                    <div className="shrink-0 text-right text-sm font-semibold leading-5">
                        {amount ? (
                            <span className={isIn ? 'text-success' : 'text-danger'}>
                                {isIn ? '+' : '-'}
                                {formatTokenUSD(amount, { minDisplay: 0.01 })}
                            </span>
                        ) : (
                            <span className="text-second">-</span>
                        )}
                    </div>
                </div>
            </HistoryCard>
        );
    }

    if (isClaimOrLostActivity(item)) {
        const claim = getClaimActivity(item);
        const trade = claim ?? getTradeActivity(item);
        const isLost =
            item.type === 'lost' ||
            (item.type === 'claim' && claim && !BigNumber(parseUsdcAmount(claim.usdcSize) ?? 0).gt(0));
        if (!trade && !claim) {
            return (
                <HistoryCard>
                    <div className="flex items-center justify-between gap-6">
                        <div
                            className={
                                isLost
                                    ? 'text-danger font-bedstead text-sm font-bold leading-5'
                                    : 'text-main text-sm font-semibold leading-5'
                            }
                        >
                            {isLost ? <Trans>Lost</Trans> : <Trans>Claim</Trans>}
                        </div>
                        <div className="text-second text-xs leading-[14px]">{whenRelative}</div>
                    </div>
                </HistoryCard>
            );
        }
        const marketAction = claim ?? trade!;
        const claimedAmount = parseUsdcAmount(marketAction.usdcSize);
        const isClaimed = !isLost && BigNumber(claimedAmount ?? 0).gt(0);
        const handleClick = marketAction.eventSlug ? () => navigateToDetail(marketAction.eventSlug) : undefined;
        return (
            <HistoryCard onClick={handleClick}>
                <MarketHeader image={marketAction.icon} title={marketAction.title} />
                {isClaimed ? (
                    <div className="mt-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-6">
                            <div className="font-bedstead text-main text-sm font-bold leading-5">
                                <Trans>Claimed</Trans>
                            </div>
                            <div className="text-success text-sm font-semibold leading-5">
                                +{formatTokenUSD(claimedAmount ?? '0', { minDisplay: 0.01 })}
                            </div>
                        </div>
                        <div className="text-second text-xs leading-[14px]">{whenRelative}</div>
                    </div>
                ) : (
                    <div className="mt-3 flex items-center justify-between gap-6">
                        <div className="font-bedstead text-danger text-sm font-bold leading-5">
                            <Trans>Lost</Trans>
                        </div>
                        <div className="text-second text-xs leading-[14px]">{whenRelative}</div>
                    </div>
                )}
            </HistoryCard>
        );
    }

    const trade = getTradeActivity(item);
    if (!trade) {
        return (
            <HistoryCard>
                <div className="flex items-center justify-between gap-6">
                    <div className="text-main text-sm font-semibold leading-5">
                        <Trans>Trade</Trans>
                    </div>
                    <div className="text-second text-xs leading-[14px]">{whenRelative}</div>
                </div>
            </HistoryCard>
        );
    }
    const totalUsd = parseUsdcAmount(trade.usdcSize) ?? '0';
    const shares = (() => {
        const size = parseUsdcAmount(trade.size) ?? '0';
        const n = Number.parseFloat(size);
        if (!Number.isFinite(n)) return { display: '-', count: 0 };
        return { display: formatTokenItemAmount(n, 2), count: n };
    })();
    const handleTradeClick = trade.eventSlug ? () => navigateToDetail(trade.eventSlug) : undefined;
    return (
        <HistoryCard onClick={handleTradeClick}>
            <MarketHeader image={trade.icon} title={trade.title} />
            <div className="mt-3 flex w-full items-start justify-between gap-6">
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="font-bedstead text-sm font-bold leading-5">
                        <span>
                            {trade.side === 'buy' ? (
                                <Trans>Buy</Trans>
                            ) : trade.side === 'sell' ? (
                                <Trans>Sell</Trans>
                            ) : null}
                            -
                        </span>
                        {trade.outcome ? (
                            <span className={trade.outcomeIndex === 0 ? 'text-success' : 'text-danger'}>
                                {trade.outcome}
                            </span>
                        ) : (
                            '-'
                        )}
                    </div>
                    <div className="text-second text-xs leading-[14px]">
                        <Plural value={shares.count} one="# share" other="# shares" />
                    </div>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-center">
                    <div className="text-main text-sm font-semibold leading-5">
                        {formatTokenUSD(totalUsd, { minDisplay: 0.01 })}
                    </div>
                    <div className="text-second text-xs leading-[14px]">
                        <Trans>Total</Trans>
                    </div>
                </div>
            </div>
            <div className="mt-2 flex w-full items-end justify-between gap-6">
                <div className="flex flex-col justify-center">
                    <div className="text-main text-sm font-semibold leading-5">{priceCents}</div>
                    <div className="text-second text-xs leading-[14px]">
                        <Trans>Price</Trans>
                    </div>
                </div>
                <div className="text-second text-xs leading-[14px]">{whenRelative}</div>
            </div>
        </HistoryCard>
    );
}

function isClaimOrLostActivity(item: PolymarketActivityItem) {
    return item.type === 'claim' || item.type === 'lost' || (item.type as string) === 'REDEEM';
}

function getClaimActivity(item: PolymarketActivityItem): PolymarketActivityMarketAction | undefined {
    if ('claim' in item && item.claim) return item.claim;
    // V2 API returns trade field for claim records
    const tradeField = (item as Record<string, unknown>).trade;
    if (tradeField && typeof tradeField === 'object' && item.type === 'claim')
        return tradeField as PolymarketActivityMarketAction;
    if ((item.type as string) === 'REDEEM') {
        // Some V2 API responses use uppercase type; try nested `claim` field first
        const nested = (item as Record<string, unknown>).claim;
        if (nested && typeof nested === 'object') return nested as PolymarketActivityMarketAction;
    }
    return undefined;
}

function getTradeActivity(item: PolymarketActivityItem): PolymarketActivityMarketAction | undefined {
    if ('trade' in item && item.trade) return item.trade;
    if ((item.type as string) === 'TRADE') {
        // Some V2 API responses use uppercase type; try nested `trade` field first
        const nested = (item as Record<string, unknown>).trade;
        if (nested && typeof nested === 'object') return nested as PolymarketActivityMarketAction;
    }
    return undefined;
}

function HistoryCard({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    return (
        <div className="w-full px-4 pt-4">
            {onClick ? (
                <button type="button" className="border-line w-full rounded-xl border p-3 text-left" onClick={onClick}>
                    {children}
                </button>
            ) : (
                <div className="border-line w-full rounded-xl border p-3">{children}</div>
            )}
        </div>
    );
}

function MarketHeader({ image, title }: { image?: string; title?: string }) {
    return (
        <div className="grid grid-cols-[40px_1fr] gap-2">
            <div className="bg-lightBg size-10 overflow-hidden rounded-lg">
                <Image
                    width={40}
                    height={40}
                    src={image}
                    alt={title ?? ''}
                    fallback={betImageFallback}
                    className="size-full object-cover"
                />
            </div>
            <div className="min-w-0">
                <div className="text-main line-clamp-2 text-sm font-semibold leading-5">{title || '-'}</div>
            </div>
        </div>
    );
}

function parseUsdcAmount(value?: string) {
    if (!value) return undefined;

    try {
        return formatUnits(/^\d+$/.test(value) ? BigInt(value) : parseUnits(value, 6), 6);
    } catch {
        return undefined;
    }
}

function sortClosedPositions(positions: PolymarketPosition[], sortBy: ClosedPositionSortBy) {
    if (sortBy === 'TIMESTAMP') {
        // Align with iOS: for redeemable positions without closed_time, synthesize a timestamp
        // from endDate (end of that day) so they interleave with closed positions by day.
        const getTimestamp = (p: PolymarketPosition): number => {
            if (p.closed_time) return p.closed_time;
            if (p.endDate) {
                const date = new Date(p.endDate);
                if (!isNaN(date.getTime())) {
                    date.setHours(23, 59, 59, 0);
                    return Math.floor(date.getTime() / 1000);
                }
            }
            return 0;
        };
        return [...positions].sort((a, b) => getTimestamp(b) - getTimestamp(a));
    }

    return [...positions].sort((a, b) => {
        switch (sortBy) {
            case 'REALIZEDPNL':
                return b.pnl - a.pnl;
            case 'AVGPRICE':
                return b.avg_price - a.avg_price;
            case 'TITLE':
                return b.title.localeCompare(a.title);
            default:
                return 0;
        }
    });
}

function dedupePositions(positions: PolymarketPosition[]) {
    const seen = new Set<string>();
    return positions.filter((position, index) => {
        const key = getPositionKey(index, position);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function formatSignedUSD(value: number) {
    if (value > 0) return `+${formatPnlUSD(value)}`;
    return formatPnlUSD(value);
}

function formatSignedPercent(value: number) {
    const text = formatPercentRate(value);
    if (value > 0 && !text.startsWith('+')) return `+${text}`;
    return text;
}

function getPositionLoss(position: PolymarketPosition) {
    const pnlLoss = Math.abs(Number(position.pnl) || 0);
    if (pnlLoss > 0) return pnlLoss;
    return Math.abs(Number(position.shares) * Number(position.avg_price)) || 0;
}

function toClaimItem(position: PolymarketPosition): PolymarketClaimV2Item | null {
    if (!position.conditionId) return null;

    const negRisk = Boolean(position.negRisk);
    const amount = computeClaimAmount({
        negRisk,
        isWin: Boolean(position.isWin),
        shares: Number(position.shares),
        cur_price: Number(position.cur_price),
        offset: Number(position.offset ?? 0),
    });

    return {
        condition_id: position.conditionId,
        negative_risk: negRisk,
        ...(amount ? { amount } : {}),
    };
}
