'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { first, isNumber } from 'lodash-es';
import { type HTMLProps, memo, useCallback, useMemo, useState } from 'react';

import EyeIcon from '@/assets/eye.svg';
import EyeCloseIcon from '@/assets/eye-close.svg';
import PriceArrow from '@/assets/price-arrow.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Link } from '@/components/Link.js';
import { PriceChart } from '@/components/PriceChart/index.js';
import { useWithinRangeRecords } from '@/components/PriceChart/useWithinRangeRecords.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { TokenSecurityBar } from '@/components/TokenProfile/TokenSecurityBar.js';
import { useTradeInfo } from '@/components/TokenProfile/useTradeInfo.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isZero } from '@/helpers/number.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useCoinPriceStats } from '@/hooks/useCoinPriceStats.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useIsPriceUp } from '@/hooks/useIsPriceUp.js';
import { useSingleCoin } from '@/hooks/useSingleCoin.js';
import { useTokenPrice } from '@/hooks/useTokenPrice.js';
import { useTokenSecurity } from '@/hooks/useTokenSecurity.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import type { PriceRecord, TradeRecord } from '@/types/token.js';

export interface TokenMarketDataProps extends HTMLProps<HTMLDivElement> {
    chainId?: number;
    tradeRecords?: TradeRecord[];
    token: CoinGeckoToken;
    linkable?: boolean;
    rank?: number;
    range?: string;
}

const getRanges = () => {
    return [
        { id: '1h', label: t`1H`, days: 1 },
        { id: '24h', label: t`24H`, days: 1 },
        { id: '7d', label: t`7D`, days: 7 },
        { id: '1m', label: t`1M`, days: 30 },
        { id: '1y', label: t`1Y`, days: 365 },
        { id: 'max', label: t`Max`, days: undefined },
    ] as const;
};

export const TokenMarketData = memo(function TokenMarketData({
    chainId: propChainId,
    linkable,
    token,
    rank,
    tradeRecords = EMPTY_LIST,
    range,
    ...rest
}: TokenMarketDataProps) {
    const ranges = getRanges();
    const { data: tokenPrice } = useTokenPrice(token.id);
    const { data: coin } = useSingleCoin(token.id, token.chainId, token.address);
    const { data: trending } = useCoinTrending(token.id);
    const { contracts } = trending ?? {};
    const chainId = token.chainId ?? propChainId;
    const contract = (chainId ? contracts?.find((x) => x.chainId === chainId) : null) || first(contracts);
    const { data: security } = useTokenSecurity(contract?.chainId, contract?.address);
    const tradeInfo = useTradeInfo(token);
    const tradeChainId = chainId ?? tradeInfo.chainId;

    const { preferences, setPreference } = usePreferencesState();
    const [activeRecord, setActiveRecord] = useState<PriceRecord>();
    const [activeTradeIndex, setActiveTradeIndex] = useState<number>();
    const [pendingTradeIndex, setPendingTradeIndex] = useState<number>();
    const [rangeId = range, setRangeId] = useState<(typeof ranges)[number]['id']>();
    const currentRange = ranges.find((x) => x.id === rangeId) || ranges[1];

    const { data: priceStats = EMPTY_LIST, isPending } = useCoinPriceStats(
        token.id,
        tradeChainId,
        token.address ?? contract?.address,
        currentRange.days,
    );
    const stats = useMemo(
        () => (currentRange.id === '1h' ? priceStats.slice(-12) : priceStats),
        [currentRange.id, priceStats],
    );
    const showUserTx = preferences.SHOW_USER_TX_IN_CHART;
    const withinRangeTradeRecords = useWithinRangeRecords(stats, tradeRecords, currentRange.id === 'max');

    const { isUp, change } = useIsPriceUp(stats, activeRecord);
    const invalidData = useMemo(() => stats.length === 0 || stats.every((item) => isZero(item.value)), [stats]);

    const baseInfo = (
        <>
            <TokenIcon icon={token.logoURL} alt={token.name} size={36} chainId={chainId} />
            <strong className="ml-0.5 text-medium font-bold text-main">{token.name}</strong>
            <span className="font-inter text-medium font-bold uppercase">{token.symbol}</span>
            {contract?.address ? <CopyTextButton className="[&_svg]:ml-0" text={contract?.address} /> : null}
        </>
    );

    const handleDotClick = useCallback((dotIndex: number) => {
        setActiveTradeIndex(dotIndex);
    }, []);

    const tokenRank = rank ?? token.rank;
    const price = tokenPrice ?? coin?.market_data?.token_price_usd;
    const change24h = change ?? coin?.market_data?.price_change_percentage_24h;

    return (
        <div {...rest} className={classNames('flex flex-col gap-1.5 p-3', rest.className)}>
            <div className="flex items-start">
                <div className="flex flex-grow flex-col gap-1.5">
                    <div className="flex items-center gap-1 text-second">
                        {linkable ? (
                            <Link
                                prefetch
                                className="contents"
                                href={resolveTokenPageUrl({ identity: token.id, isCoinId: true })}
                            >
                                {baseInfo}
                            </Link>
                        ) : (
                            baseInfo
                        )}
                        {tokenRank ? (
                            <span className="inline-flex h-[14px] items-center whitespace-nowrap rounded bg-highlight px-1 py-0.5 text-[10px] text-white">
                                <Trans>Rank #{tokenRank}</Trans>
                            </span>
                        ) : null}
                        <SwapButton
                            className="ml-auto sm:hidden md:inline-flex"
                            tradable={tradeInfo.tradable}
                            swapProps={
                                tradeChainId && tradeInfo.address
                                    ? {
                                          toToken: tradeInfo.address,
                                          chainId: tradeChainId,
                                          chainIds: tradeInfo.supportedChainIds.map((x) => x.toString()),
                                      }
                                    : undefined
                            }
                        >
                            {t`Swap`}
                        </SwapButton>
                    </div>
                    <div className="line-height-[22px] flex flex-col gap-2">
                        <div className="text-2xl font-bold">
                            ${renderShrankPrice(formatPrice(activeRecord?.value ?? price) ?? '-')}
                        </div>
                        <div className="flex items-center">
                            <PriceArrow
                                width={20}
                                height={20}
                                className={
                                    isUp === undefined ? 'text-third' : isUp ? 'text-success' : 'rotate-180 text-fail'
                                }
                            />
                            <span className={isUp ? 'text-medium text-success' : 'text-medium text-fail'}>
                                {isNumber(change24h) ? `${change24h.toFixed(2)}%` : '--%'}
                            </span>
                            {activeRecord ? (
                                <span className="ml-2 text-sm text-secondary">
                                    {dayjs(activeRecord.date).format('MMM DD, YYYY, hh:mm A')}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <TokenSecurityBar security={security} />
                </div>
            </div>
            <div
                className={classNames(
                    'flex h-[175px] items-center justify-center overflow-auto',
                    isPending ? 'animate-pulse' : null,
                )}
            >
                {isPending ? (
                    <div className="mx-2 h-40 flex-grow rounded-lg bg-gray-100 dark:bg-gray-800" />
                ) : invalidData ? (
                    <div className="mx-2 h-40 flex-grow rounded-lg">
                        <Trans>There is no data available to display</Trans>
                    </div>
                ) : (
                    <PriceChart
                        className="size-full"
                        records={stats}
                        tradeRecords={showUserTx ? withinRangeTradeRecords : EMPTY_LIST}
                        activeTradeIndex={pendingTradeIndex ?? activeTradeIndex}
                        onHover={(payload) => setActiveRecord(payload)}
                        onMouseLeave={() => setActiveRecord(undefined)}
                        onDotClick={handleDotClick}
                    />
                )}
            </div>
            <div className="flex h-[10px] items-center">
                {showUserTx && withinRangeTradeRecords.length > 1 ? (
                    <div className="no-scrollbar flex flex-grow flex-nowrap gap-1 overflow-auto">
                        {withinRangeTradeRecords.map((_, i) => {
                            const activeRecordIndex = activeRecord
                                ? withinRangeTradeRecords.findIndex((x) => x.date === activeRecord?.date)
                                : undefined;
                            return (
                                <div
                                    key={i}
                                    className="group min-w-4 max-w-[60px] shrink-0 flex-grow cursor-pointer py-1 first:ml-auto last:mr-auto"
                                    onClick={() => {
                                        setActiveTradeIndex((prev) => (prev === i ? undefined : i));
                                    }}
                                    onMouseEnter={() => {
                                        setPendingTradeIndex(i);
                                    }}
                                    onMouseLeave={() => {
                                        setPendingTradeIndex(undefined);
                                    }}
                                >
                                    <div
                                        className={classNames(
                                            'h-[2px] flex-grow cursor-pointer rounded-[2px] group-hover:bg-third group-hover:dark:bg-secondary',
                                            activeTradeIndex === i || activeRecordIndex === i
                                                ? 'bg-third dark:bg-secondary'
                                                : 'bg-secondaryLine',
                                        )}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </div>

            <div className="flex gap-2.5">
                <div className="flex gap-2">
                    {ranges.map((range) => (
                        <ClickableButton
                            className={classNames(
                                'h-6 min-w-10 rounded-lg px-2',
                                currentRange.id === range.id
                                    ? 'light rounded-[18px] bg-input font-bold text-main'
                                    : 'bg-transparent text-secondary',
                            )}
                            key={range.label}
                            onClick={() => setRangeId(range.id)}
                        >
                            {range.label}
                        </ClickableButton>
                    ))}
                </div>
                {withinRangeTradeRecords.length ? (
                    <ClickableButton
                        className="ml-auto"
                        onClick={() => {
                            setPreference('SHOW_USER_TX_IN_CHART', !showUserTx);
                        }}
                    >
                        {showUserTx ? (
                            <EyeIcon className="size-4 text-secondary" width={16} height={16} />
                        ) : (
                            <EyeCloseIcon className="size-4 text-secondary" width={16} height={16} />
                        )}
                    </ClickableButton>
                ) : null}
            </div>
        </div>
    );
});
