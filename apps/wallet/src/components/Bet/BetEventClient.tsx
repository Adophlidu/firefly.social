import betImageFallback from '@dimensiondev/assets/bet-image-fallback.svg?url';
import CloseIcon from '@dimensiondev/assets/close.svg';
import SwapIcon from '@dimensiondev/assets/doube-arrow.svg';
import RandomIcon from '@dimensiondev/assets/random-firefly.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { parseJson } from '@dimensiondev/utils';
import { createWagmiPublicClient } from '@dimensiondev/web3/actions';
import { resolvePublicRpcUrl } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { first, isArray, isObject, isUndefined, last } from 'lodash-es';
import { type ReactNode, useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { polygon } from 'viem/chains';

import { BuyLimitForm, BuyMarketForm } from '@/components/Bet/BuyForm.js';
import { SellLimitForm, SellMarketForm } from '@/components/Bet/SellForm.js';
import { Image } from '@/components/Image.js';
import { Button } from '@/components/ui/button.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { MarketNotFoundError } from '@/constants/error.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { getErrorMessage } from '@/helpers/getErrorMessage.js';
import { optimisticAddBalance, optimisticSubtractBalance } from '@/helpers/polymarketBalanceCache.js';
import {
    optimisticAddPosition,
    optimisticSubtractPositionShares,
    optimisticUpdatePositionShares,
} from '@/helpers/polymarketPositionsCache.js';
import { polymarketGammaEndpoint } from '@/providers/polymarket/gamma.js';
import {
    type MarketPriceChangeData,
    MarketsWebSocketProvider,
} from '@/providers/polymarket/MarketsWebSocketProvider.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

enum OrderType {
    Market = 'Market',
    Limit = 'Limit',
}

enum Side {
    Buy = 'buy',
    Sell = 'sell',
}

const NO_NEW_BETS_ACCEPTED_ERROR_CODE = 'NO_NEW_BETS_ACCEPTED';
const PLACE_ORDER_TOAST_ID = 'place-order';

function useBetEventQueryParams() {
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const searchParams = location.search as Record<string, string | undefined>;
    const [isPending, startTransition] = useTransition();

    const parseSide = (v: string | null | undefined): Side => (v === Side.Sell ? Side.Sell : Side.Buy);
    const parseOrderType = (v: string | null | undefined): OrderType => {
        if (!v) return OrderType.Market;
        return v.toLowerCase() === 'limit' ? OrderType.Limit : OrderType.Market;
    };
    const parseOutcomeIndex = (v: string | null | undefined): number => {
        const n = v ? Number.parseInt(v, 10) : 0;
        return Number.isFinite(n) && n >= 0 ? n : 0;
    };

    const [side, setSide] = useState<Side>(() => parseSide(searchParams?.side));
    const [orderType, setOrderType] = useState<OrderType>(() => parseOrderType(searchParams?.type));
    const [outcome, setOutcome] = useState<number>(() => parseOutcomeIndex(searchParams?.outcome));

    // Keep local optimistic state in sync with URL changes (back/forward, external navigation).
    // Wrapped in startTransition to avoid Suspense fallback flash when external URL
    // changes cause form components with useSuspenseQuery to mount.
    useEffect(() => {
        startTransition(() => {
            setSide(parseSide(searchParams?.side));
            setOrderType(parseOrderType(searchParams?.type));
            setOutcome(parseOutcomeIndex(searchParams?.outcome));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(searchParams)]);

    const setQueryParams = (patch: Partial<{ side: Side; orderType: OrderType; outcome: number }>) => {
        const nextSide = patch.side ?? side;
        const nextOrderType = patch.orderType ?? orderType;
        const nextOutcome = patch.outcome ?? outcome;

        // Wrap state updates and navigation in startTransition to prevent Suspense
        // fallback flash when switching Buy/Sell or Market/Limit — newly mounted form
        // components use useSuspenseQuery which can trigger the Suspense boundary.
        startTransition(() => {
            if (patch.side !== undefined) setSide(nextSide);
            if (patch.orderType !== undefined) setOrderType(nextOrderType);
            if (patch.outcome !== undefined) setOutcome(nextOutcome);

            navigate({
                to: pathname,
                search: {
                    side: nextSide,
                    type: nextOrderType.toLowerCase(),
                    outcome: String(nextOutcome),
                },
                replace: true,
                resetScroll: false,
            });
        });
    };

    const priceFromUrl =
        !isUndefined(searchParams?.limitPrice) && !Number.isNaN(Number(searchParams.limitPrice))
            ? Number.parseFloat(searchParams.limitPrice)
            : undefined;

    return { side, orderType, outcome, priceFromUrl, setQueryParams, isPending };
}

export default function BetEventClient({ id }: { id: string }) {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = location.search as Record<string, string | undefined>;
    const fallbackEventSlug = searchParams?.eventSlug ?? '';
    const fallbackConditionId = searchParams?.conditionId ?? '';
    const { side, orderType, outcome: selectedOutcomeIndex, priceFromUrl, setQueryParams } = useBetEventQueryParams();
    const queryClient = useQueryClient();
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const [prices, setPrices] = useState<MarketPriceChangeData[]>();

    const { data } = useSuspenseQuery({
        queryKey: ['polymarketGammaEndpoint', id, fallbackEventSlug, fallbackConditionId],
        async queryFn() {
            const result = await polymarketGammaEndpoint.getMarketBySlug(id);
            if (result.ok) return result;

            // Fallback: resolve market via event slug + conditionId (from Positions).
            // Try fallbackEventSlug first, then id itself (in case id is an event slug).
            const eventSlugToTry = fallbackEventSlug || id;
            const eventResult = await polymarketGammaEndpoint.getEventBySlug(eventSlugToTry);
            const markets = eventResult.ok ? (eventResult.data?.markets ?? []) : [];
            const matched =
                markets.find((m) => m?.conditionId === fallbackConditionId) ?? markets.find((m) => Boolean(m?.slug));
            if (matched) {
                return {
                    ok: true,
                    status: eventResult.status ?? 200,
                    data: matched,
                    raw: eventResult.raw,
                };
            }

            throw new MarketNotFoundError();
        },
        select(result) {
            const market = result.data;
            if (!market) return market;
            const outcomes = parseJson<string[]>(market.outcomes) ?? [];
            const tokenIds = parseJson<string[]>(market.clobTokenIds) ?? [];
            const outcomePrices = parseJson<Array<string | number>>(market.outcomePrices) ?? [];
            const outcomeOptions = outcomes.map((outcome, index) => {
                const raw = outcomePrices[index];
                const p = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number.parseFloat(raw) : NaN;
                const price = Number.isFinite(p) && p > 0 && p < 1 ? p : 0.5;
                return { outcome, bestBid: price, bestAsk: price };
            });
            const resolvedImage = market.image || first(market.events)?.image || null;
            return {
                ...market,
                resolvedImage,
                parsedOutcomes: outcomes,
                parsedTokenIds: tokenIds,
                parsedOutcomePrices: outcomePrices,
                outcomeOptions,
            };
        },
    });

    const { data: orderBooks } = useQuery({
        queryKey: ['polymarketOrderBooks', data?.parsedTokenIds],
        enabled: data?.parsedTokenIds?.length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async ({ signal }) => {
            return getFireflyEndpoint().getPolymarketOrderBooks(data?.parsedTokenIds || [], signal);
        },
    });

    const outcomeOptions = useMemo(() => {
        return (data?.outcomeOptions ?? []).map((option, index) => {
            const id = data?.parsedTokenIds?.[index];
            if (!id) return option;

            if (!!orderBooks?.length && !prices?.length) {
                const orderBook = orderBooks.find((book) => book.asset_id === id);
                if (orderBook) {
                    return {
                        ...option,
                        bestAsk: !orderBook.asks.length ? 0 : Number.parseFloat(last(orderBook.asks)?.price ?? '0'),
                        bestBid: !orderBook.bids.length ? 0 : Number.parseFloat(last(orderBook.bids)?.price ?? '0'),
                    };
                }
            }

            const priceData = prices?.find((p) => p.asset_id === id);
            if (!priceData) return option;

            return {
                ...option,
                bestAsk: Number.parseFloat(priceData.best_ask),
                bestBid: Number.parseFloat(priceData.best_bid),
            };
        });
    }, [data?.outcomeOptions, data?.parsedTokenIds, prices, orderBooks]);

    const tokenIds = data?.parsedTokenIds ?? [];
    const safeOutcomeIndex = Math.min(
        Math.max(selectedOutcomeIndex, 0),
        Math.max(Math.min(tokenIds.length - 1, outcomeOptions.length - 1), 0),
    );
    const selectedTokenId = tokenIds[safeOutcomeIndex];
    const conditionId = data?.conditionId;
    const orderPriceMinTickSize =
        typeof data?.orderPriceMinTickSize === 'number' && Number.isFinite(data.orderPriceMinTickSize)
            ? data.orderPriceMinTickSize
            : null;

    const outcomePrices = outcomeOptions[safeOutcomeIndex];
    const outcome = outcomeOptions[safeOutcomeIndex]?.outcome ?? '';
    // Use outcomePrices directly (single source of truth for UI display + defaults).

    const submitDisabledReason: ReactNode | null = useMemo((): ReactNode | null => {
        if (data?.closed === true) {
            return <Trans>The market is marked as closed.</Trans>;
        }
        return null;
    }, [data?.closed]);

    const isMarketResolvedOrDisputed = Boolean(submitDisabledReason);

    const { mutateAsync: placeOrder, isPending } = useMutation({
        mutationKey: ['polymarket-place-order', id, safeOutcomeIndex, orderType],
        async mutationFn(args: { side: 'BUY' | 'SELL'; amount: number; overrideLimitPrice?: number }) {
            if (isMarketResolvedOrDisputed) throw new Error(NO_NEW_BETS_ACCEPTED_ERROR_CODE);
            const tokenId = tokenIds[safeOutcomeIndex];
            if (!tokenId) throw new Error('Missing tokenId for selected outcome');
            const amountNum = args.amount;
            if (!Number.isFinite(amountNum) || amountNum <= 0) throw new Error('Invalid amount');

            if (orderType === OrderType.Limit) {
                const bestAsk = outcomeOptions[safeOutcomeIndex]?.bestAsk;
                const bestBid = outcomeOptions[safeOutcomeIndex]?.bestBid;
                const fallbackLimitPrice = Number(args.side === 'BUY' ? bestAsk : bestBid);
                const limitPrice = args.overrideLimitPrice ?? fallbackLimitPrice;
                if (!Number.isFinite(limitPrice) || limitPrice <= 0) throw new Error('Invalid limit price');
                return getFireflyEndpoint().createPolymarketLimitOrder({
                    tokenId,
                    side: args.side,
                    amount: amountNum,
                    price: limitPrice,
                });
            }

            const order = await getFireflyEndpoint().createPolymarketMarketOrder({
                tokenId,
                side: args.side,
                amount: amountNum,
            });
            for (const hash of order?.transactionsHashes ?? []) {
                const client = createWagmiPublicClient(polygon.id, resolvePublicRpcUrl(polygon.id));
                await client.waitForTransactionReceipt({ hash: hash as `0x${string}` });
            }

            return order;
        },
        onMutate() {
            toast.dismiss();
            toast.loading(<Trans>Placing order...</Trans>, { id: PLACE_ORDER_TOAST_ID });
        },
        async onSuccess(_data, variables) {
            toast.dismiss(PLACE_ORDER_TOAST_ID);
            if (variables?.side === 'SELL') {
                toast.success(
                    <>
                        <Trans>Sold</Trans> {outcome}
                    </>,
                );
            } else {
                toast.success(
                    <>
                        <Trans>Bought</Trans> {outcome}
                    </>,
                );
            }

            // 1. Optimistically update Positions list first (before navigation)
            const outcomeLabel = (outcomeOptions[safeOutcomeIndex]?.outcome ?? '').toString().toLowerCase();

            if (account?.proxyAddress && variables?.side === 'SELL' && conditionId) {
                const soldShares = BigNumber(variables.amount ?? 0);
                optimisticSubtractPositionShares(queryClient, {
                    proxyAddress: account.proxyAddress,
                    matcher: { conditionId, tokenId: selectedTokenId, outcomeLabel },
                    sharesToSubtract: soldShares,
                });
            }

            if (account?.proxyAddress && variables?.side === 'BUY' && conditionId && selectedTokenId) {
                const boughtShares = variables.overrideLimitPrice
                    ? BigNumber(variables.amount ?? 0)
                    : BigNumber(_data?.makingAmount ?? 0);
                const purchasePrice = variables.overrideLimitPrice ?? outcomePrices?.bestAsk ?? 0;

                if (boughtShares.isFinite() && boughtShares.gt(0)) {
                    const updated = optimisticUpdatePositionShares(queryClient, {
                        proxyAddress: account.proxyAddress,
                        matcher: { conditionId, tokenId: selectedTokenId, outcomeLabel },
                        shareDelta: boughtShares,
                        purchasePrice,
                        curPrice: outcomePrices?.bestAsk,
                    });

                    if (!updated && data) {
                        optimisticAddPosition(queryClient, {
                            proxyAddress: account.proxyAddress,
                            conditionId,
                            tokenId: selectedTokenId,
                            shares: boughtShares,
                            purchasePrice,
                            curPrice: outcomePrices?.bestAsk ?? 0,
                            marketData: {
                                title: data.question ?? '',
                                image: data.resolvedImage ?? '',
                                marketSlug: data.slug ?? '',
                                outcomeLabel,
                                eventSlug: data.groupItemTitle,
                            },
                        });
                    }
                }
            }

            // 2. Navigate away to avoid availableShares refetch showing stale data (FW-6800)
            navigate({ to: '/bet', replace: true });

            // 3. Optimistically update balance after navigation
            if (account?.proxyAddress && variables?.side === 'SELL' && conditionId) {
                const soldShares = BigNumber(variables.amount ?? 0);
                const sellPrice = variables.overrideLimitPrice ?? outcomePrices?.bestBid ?? 0;
                const receivedAmount = soldShares.times(sellPrice);
                optimisticAddBalance(queryClient, account.proxyAddress, receivedAmount);
            }

            if (account?.proxyAddress && variables?.side === 'BUY') {
                const spentAmount = variables.overrideLimitPrice
                    ? BigNumber(variables.amount ?? 0).times(variables.overrideLimitPrice)
                    : BigNumber(variables.amount ?? 0);
                optimisticSubtractBalance(queryClient, account.proxyAddress, spentAmount);

                // Notify parent page after BUY
                iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NOTIFY, {
                    type: 'position-operation',
                    data: { action: 'buy', address: account.proxyAddress },
                });
            }
        },
        onError(error: unknown, variables) {
            toast.dismiss(PLACE_ORDER_TOAST_ID);
            const message = getErrorMessage(error);
            if (message === NO_NEW_BETS_ACCEPTED_ERROR_CODE) {
                return;
            }
            if (variables?.side === 'SELL') {
                toast.error(
                    <>
                        <Trans>Failed to place sell order. </Trans>
                        {message}
                    </>,
                );
            } else {
                toast.error(
                    <>
                        <Trans>Failed to place buy order. </Trans>
                        {message}
                    </>,
                );
            }
        },
    });

    const firstTokenId = first(tokenIds);
    useEffect(() => {
        if (!firstTokenId) return;

        const provider = new MarketsWebSocketProvider();
        provider.subscribeToMarket([firstTokenId], (message) => {
            if (!message) return;

            if (
                !isArray(message) &&
                isObject(message) &&
                message.event_type === 'price_change' &&
                message.price_changes.length
            ) {
                setPrices(message.price_changes);
            }
        });

        return () => {
            provider.close();
        };
    }, [firstTokenId]);

    let formNode: ReactNode = null;
    if (selectedTokenId) {
        if (side === Side.Buy) {
            formNode =
                orderType === OrderType.Market ? (
                    <BuyMarketForm
                        outcome={outcome}
                        tokenId={selectedTokenId}
                        loading={isPending}
                        submitDisabled={isMarketResolvedOrDisputed}
                        onSubmit={(amount) => placeOrder({ side: 'BUY', amount: Number(amount) })}
                    />
                ) : (
                    <BuyLimitForm
                        outcome={outcome}
                        tokenId={selectedTokenId}
                        defaultLimitPrice={priceFromUrl ?? outcomePrices?.bestAsk}
                        orderPriceMinTickSize={orderPriceMinTickSize}
                        loading={isPending}
                        submitDisabled={isMarketResolvedOrDisputed}
                        onSubmit={({ shares, limitPrice }) =>
                            placeOrder({ side: 'BUY', amount: shares, overrideLimitPrice: limitPrice })
                        }
                    />
                );
        } else {
            if (conditionId) {
                formNode =
                    orderType === OrderType.Market ? (
                        <SellMarketForm
                            outcome={outcome}
                            tokenId={selectedTokenId}
                            conditionId={conditionId}
                            loading={isPending}
                            submitDisabled={isMarketResolvedOrDisputed}
                            onSubmit={({ shares }) => placeOrder({ side: 'SELL', amount: shares })}
                        />
                    ) : (
                        <SellLimitForm
                            outcome={outcome}
                            tokenId={selectedTokenId}
                            conditionId={conditionId}
                            defaultLimitPrice={outcomePrices?.bestBid}
                            orderPriceMinTickSize={orderPriceMinTickSize}
                            loading={isPending}
                            submitDisabled={isMarketResolvedOrDisputed}
                            onSubmit={({ shares, limitPrice }) =>
                                placeOrder({ side: 'SELL', amount: shares, overrideLimitPrice: limitPrice })
                            }
                        />
                    );
            }
        }
    }

    return (
        <div className="flex w-full flex-1 flex-col">
            {submitDisabledReason ? (
                <div className="bg-warn w-full px-3 py-2 text-center text-xs text-white">{submitDisabledReason}</div>
            ) : null}
            <div className="grid w-full grid-cols-[1fr_36px] items-center gap-2 p-4">
                <button
                    type="button"
                    className="grid grid-cols-[40px_1fr] items-center gap-2 text-left"
                    onClick={() => {
                        const eventSlug = first(data.events ?? [])?.slug || fallbackEventSlug;
                        iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
                            path: `/polymarket/event/${eventSlug}`,
                        });
                    }}
                >
                    <div className="bg-lightBg size-10 rounded-lg">
                        {data?.resolvedImage ? (
                            <Image
                                src={data.resolvedImage}
                                fallback={betImageFallback}
                                alt={id}
                                className="size-10 rounded-lg object-cover"
                                width={40}
                                height={40}
                            />
                        ) : (
                            <RandomIcon width={40} height={40} className="outline-lightLineSecond rounded-lg outline" />
                        )}
                    </div>
                    <div className="text-sm font-semibold">{data?.question || id}</div>
                </button>
                <Button size="icon" variant="ghost" onClick={() => navigate({ to: '/bet', replace: true })}>
                    <CloseIcon width={24} height={24} className="size-6" />
                </Button>
            </div>
            <div className="flex h-8 items-center justify-between px-4">
                <Tabs
                    value={side}
                    onValueChange={(x) => {
                        setQueryParams({ side: x as Side });
                    }}
                >
                    <TabsList variant="bold">
                        <TabsTrigger variant="bold" value={Side.Buy}>
                            <Trans>Buy</Trans>
                        </TabsTrigger>
                        <TabsTrigger variant="bold" value={Side.Sell}>
                            <Trans>Sell</Trans>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <button
                    className="flex items-center space-x-1 text-sm font-medium"
                    onClick={() =>
                        setQueryParams({
                            orderType: orderType === OrderType.Market ? OrderType.Limit : OrderType.Market,
                        })
                    }
                >
                    {orderType === OrderType.Market ? (
                        <span>
                            <Trans>Market</Trans>
                        </span>
                    ) : (
                        <span>
                            <Trans>Limit</Trans>
                        </span>
                    )}{' '}
                    <SwapIcon width={14} height={14} />
                </button>
            </div>
            <div className="grid w-full grid-cols-2 gap-3 px-4 pt-4">
                {outcomeOptions.map(({ outcome, bestAsk, bestBid }, i) => {
                    const displayPrice = side === Side.Buy ? bestAsk : bestBid;
                    const tokenId = tokenIds[i];
                    return (
                        <Button
                            key={tokenId ? `${tokenId}-${i}` : `${outcome}-${i}`}
                            variant="secondary"
                            colorPattern={
                                i === safeOutcomeIndex ? ((['success', 'danger'] as const)[i] ?? 'purple') : undefined
                            }
                            onClick={() => setQueryParams({ outcome: i })}
                            className="min-w-0 justify-start overflow-hidden"
                        >
                            <span className="min-w-0 flex-1 truncate text-left">{outcome}</span>
                            {!isUndefined(displayPrice) ? (
                                <span className="ml-1 shrink-0 whitespace-nowrap">
                                    {removeTrailingZeros(((displayPrice === 1 ? 0 : displayPrice) * 100).toFixed(1))}¢
                                </span>
                            ) : null}
                        </Button>
                    );
                })}
            </div>
            {formNode}
        </div>
    );
}
