import betImageFallback from '@dimensiondev/assets/bet-image-fallback.svg?url';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { removeTrailingZeros } from '@dimensiondev/utils';
import { Plural, Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import dayjs from 'dayjs';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { formatUnits, parseUnits } from 'viem';

import { Image } from '@/components/Image.js';
import { ListInPage } from '@/components/ListInPage.js';
import { formatDate } from '@/helpers/formatDate.js';
import { formatTokenItemAmount } from '@/helpers/formatTokenItemAmount.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { useLocale } from '@/helpers/getCookies.js';
import type { PolymarketActivityItem } from '@/providers/types/Firefly.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function History() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket-user-activity', account.proxyAddress.toLowerCase()],
        initialPageParam: undefined as undefined | string,
        async queryFn({ pageParam }) {
            return getFireflyEndpoint().getPolymarketUserActivity({
                proxyWallet: account.proxyAddress,
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
                itemContent: getItemContent,
                context: {
                    footerText: <Trans>No more history</Trans>,
                },
            }}
            NoResultsFallbackProps={{
                className: 'px-4',
            }}
        />
    );
}

function getItemContent(index: number, item: PolymarketActivityItem) {
    return <HistoryItem key={`${item.transactionHash}-${index}`} item={item} />;
}

function HistoryItem({ item }: { item: PolymarketActivityItem }) {
    const locale = useLocale();
    const whenRelative = formatDate(dayjs.unix(item.timestamp), 'shortDate', locale);

    const priceCents = useMemo(() => {
        if (item.type !== 'trade') return '-';
        const price = item.trade?.price;
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
        const raw = item.depositWithdraw?.amount;
        const amount = raw && /^\d+$/.test(raw) ? formatUnits(BigInt(raw), 6) : undefined;
        return (
            <HistoryCard>
                <div className="flex items-center gap-2">
                    <div className="bg-lightBg flex size-10 items-center justify-center rounded-full">
                        {isIn ? <ArrowDown width={20} height={20} /> : <ArrowUp width={20} height={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-main truncate text-sm font-semibold leading-5">
                            {isIn ? <Trans>Add Funds</Trans> : <Trans>Withdraw</Trans>}
                        </div>
                        <div className="text-second text-xs leading-[14px]">
                            {formatDate(dayjs.unix(item.timestamp), 'shortDate', locale)}
                        </div>
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

    if (item.type === 'claim') {
        const claim = item.claim;
        if (!claim) {
            return (
                <HistoryCard>
                    <div className="flex items-center justify-between gap-6">
                        <div className="text-main text-sm font-semibold leading-5">
                            <Trans>Claim</Trans>
                        </div>
                        <div className="text-second text-xs leading-[14px]">{whenRelative}</div>
                    </div>
                </HistoryCard>
            );
        }
        const claimed = /^\d+$/.test(claim.usdcSize) ? BigInt(claim.usdcSize) : parseUnits(claim.usdcSize, 6);
        const isClaimed = claimed > 0n;
        const claimedAmount = isClaimed ? formatUnits(claimed, 6) : undefined;
        const handleClick = claim.eventSlug ? () => navigateToDetail(claim.eventSlug) : undefined;
        return (
            <HistoryCard onClick={handleClick}>
                <MarketHeader image={claim.icon} title={claim.title} />
                {isClaimed ? (
                    <div className="mt-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-6">
                            <div className="text-main text-sm font-bold leading-5">
                                <Trans>Claimed</Trans>
                            </div>
                            <div className="text-success text-sm font-semibold leading-5">
                                +{formatTokenUSD(claimedAmount ?? '0', { minDisplay: 0.01 })}
                            </div>
                        </div>
                        <div className="text-second text-xs leading-[14px]">{whenRelative}</div>
                    </div>
                ) : (
                    <div className="mt-3 flex flex-col gap-1">
                        <div className="text-danger text-sm font-bold leading-5">
                            <Trans>Lost</Trans>
                        </div>
                        <div className="text-second text-xs leading-[14px]">{whenRelative}</div>
                    </div>
                )}
            </HistoryCard>
        );
    }

    const trade = item.trade;
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
    const totalUsd = formatUnits(
        /^\d+$/.test(trade.usdcSize) ? BigInt(trade.usdcSize) : parseUnits(trade.usdcSize, 6),
        6,
    );
    const shares = (() => {
        const size = formatUnits(/^\d+$/.test(trade.size) ? BigInt(trade.size) : parseUnits(trade.size, 6), 6);
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
                            <>
                                <span className={trade.outcomeIndex === 0 ? 'text-success' : 'text-danger'}>
                                    {trade.outcome}
                                </span>
                            </>
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
