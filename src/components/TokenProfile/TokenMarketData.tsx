'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { useContext, useMemo, useRef, useState } from 'react';

import PriceArrow from '@/assets/price-arrow.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { TokenContext } from '@/components/Token/TokenContext.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { TokenSecurityBar } from '@/components/TokenProfile/TokenSecurityBar.js';
import { useTradeInfo } from '@/components/TokenProfile/useTradeInfo.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isZero } from '@/helpers/number.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useCoinPrice24hStats, useCoinPriceStats } from '@/hooks/useCoinPriceStats.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import type { Dimension } from '@/hooks/useLineChart.js';
import { usePriceLineChart } from '@/hooks/usePriceLineChart.js';
import { useTokenPrice } from '@/hooks/useTokenPrice.js';
import { useTokenSecurity } from '@/hooks/useTokenSecurity.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';

interface TokenMarketDataProps {
    token: CoinGeckoToken;
    linkable?: boolean;
    rank?: number;
}

const dimension: Dimension = {
    top: 32,
    right: 32,
    bottom: 32,
    left: 32,
    width: 543,
    height: 175,
};

export function TokenMarketData({ linkable, token, rank }: TokenMarketDataProps) {
    const chartRef = useRef<SVGSVGElement>(null);
    const { data: price } = useTokenPrice(token.id);
    const { data: trending } = useCoinTrending(token.id);
    const { market, contracts } = trending ?? {};
    const contract = first(contracts);
    const { data: security } = useTokenSecurity(contract?.chainId, contract?.address);
    const { setTradable, setSwapProps } = useContext(TokenContext);
    const tradeInfo = useTradeInfo(token);

    setTradable(tradeInfo.tradable);
    setSwapProps({
        toToken: tradeInfo.address,
        chainId: tradeInfo.chainId,
        chainIds: tradeInfo.supportedChainIds?.map((x) => x.toString()),
    });

    const ranges = [
        { label: t`24h`, days: 1 },
        { label: t`7d`, days: 7 },
        { label: t`1m`, days: 30 },
        { label: t`1y`, days: 365 },
        { label: t`Max`, days: undefined },
    ] as const;

    const [days, setDays] = useState<number | undefined>(ranges[0].days);
    const { data: priceStats = EMPTY_LIST, isPending } = useCoinPriceStats(token.id, days);
    const { isUp } = useCoinPrice24hStats(token.id);

    usePriceLineChart(chartRef, priceStats, dimension, `price-chart-${token.symbol}`);

    const noValidData = useMemo(() => {
        return priceStats.length === 0 || priceStats.every((item) => isZero(item.value));
    }, [priceStats]);

    const baseInfo = (
        <>
            <Image
                className="overflow-hidden rounded-full"
                src={token.logoURL}
                alt={token.name}
                width={24}
                height={24}
            />
            <strong className="ml-0.5 text-medium font-bold text-main">{token.name}</strong>
            <span className="font-inter text-medium font-bold uppercase">{token.symbol}</span>
        </>
    );

    const tokenRank = rank ?? token.rank;

    return (
        <>
            <div className="flex items-start">
                <div className="flex flex-grow flex-col gap-1.5">
                    <div className="flex items-center gap-1 text-second">
                        {linkable ? (
                            <Link prefetch className="contents" href={resolveTokenPageUrl(token.id)}>
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
                    </div>
                    <div className="line-height-[22px] flex items-center gap-1">
                        <strong className="text-2xl font-bold">${renderShrankPrice(formatPrice(price) ?? '-')}</strong>
                        <PriceArrow
                            width={20}
                            height={20}
                            className={classNames(isUp ? 'text-success' : 'rotate-180 text-fail')}
                        />
                        {market?.price_change_percentage_24h_in_currency !== undefined ? (
                            <span className={isUp ? 'text-medium text-success' : 'text-medium text-fail'}>
                                {market.price_change_percentage_24h_in_currency.toFixed(2)}%
                            </span>
                        ) : null}
                    </div>
                    <TokenSecurityBar security={security} />
                </div>
                <SwapButton
                    className="sm:hidden md:inline-flex"
                    swapProps={
                        tradeInfo.chainId
                            ? {
                                  toToken: tradeInfo.address,
                                  chainId: tradeInfo.chainId,
                                  chainIds: tradeInfo.supportedChainIds.map((x) => x.toString()),
                              }
                            : undefined
                    }
                />
            </div>
            <div
                className={classNames(
                    'flex h-[175px] items-center justify-center overflow-auto',
                    isPending ? 'animate-pulse' : null,
                )}
            >
                {isPending ? (
                    <div className="mx-2 h-40 flex-grow rounded-lg bg-gray-100 dark:bg-gray-800" />
                ) : noValidData ? (
                    <div className="mx-2 h-40 flex-grow rounded-lg">
                        <Trans>There is no data available to display</Trans>
                    </div>
                ) : (
                    <svg ref={chartRef} width="100%" height={175} viewBox="0 0 543 175" />
                )}
            </div>

            <div className="mt-4 flex gap-2.5 rounded-[28px] border border-line bg-input p-1 dark:bg-white/20">
                {ranges.map((range) => (
                    <ClickableButton
                        className={classNames(
                            'box-border block h-[34px] flex-grow px-3 py-2 text-sm text-main',
                            days === range.days
                                ? 'rounded-[18px] bg-primaryBottom font-bold shadow-[0px_2px_5px_1px_rgba(24,24,24,0.05)]'
                                : 'bg-transparent',
                        )}
                        key={range.label}
                        onClick={() => setDays(range.days)}
                    >
                        {range.label}
                    </ClickableButton>
                ))}
            </div>
        </>
    );
}
