'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import DexScreenerIcon from '@dimensiondev/assets/dex-screener.svg';
import GlobalIcon from '@dimensiondev/assets/global.svg';
import PriceArrow from '@dimensiondev/assets/price-arrow.svg';
import TwitterIcon from '@dimensiondev/assets/x-fill.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { ETH_NATIVE_TOKEN_ADDRESS } from '@dimensiondev/web3/constants';
import { formatAddress, isZeroAddress } from '@dimensiondev/web3/utils';
import { Plural, Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { first, isNumber } from 'lodash-es';
import { type HTMLProps, memo, type ReactNode, useCallback, useMemo, useState } from 'react';
import { mainnet } from 'viem/chains';

import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Link } from '@/components/Link.js';
import { PriceChart } from '@/components/PriceChart/index.js';
import { useWithinRangeRecords } from '@/components/PriceChart/useWithinRangeRecords.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { TokenBookmarkButton } from '@/components/Token/TokenBookmarkButton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { TokenSecurityBar } from '@/components/TokenProfile/TokenSecurityBar.js';
import { TradeFilter } from '@/components/TokenProfile/TradeFilter.js';
import { useTradeInfo } from '@/components/TokenProfile/useTradeInfo.js';
import { TRACING_RUNTIME_LIST } from '@/constants/computed.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isZero } from '@/helpers/number.js';
import { resolveCoinGeckoChain } from '@/helpers/resolveCoinGeckoChain.js';
import { resolveCoinGeckoCoinChainId } from '@/helpers/resolveCoingeckoCoinChainId.js';
import { resolveDexScreenerUrl } from '@/helpers/resolveDexScreenerUrl.js';
import { resolveAddressLink } from '@/helpers/resolveExplorer.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useCoinPriceStats } from '@/hooks/useCoinPriceStats.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useIsPriceUp } from '@/hooks/useIsPriceUp.js';
import { useSingleCoin } from '@/hooks/useSingleCoin.js';
import { useTokenPrice } from '@/hooks/useTokenPrice.js';
import { useTokenSecurity } from '@/hooks/useTokenSecurity.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import type { Contract } from '@/providers/types/Trending.js';
import type { PriceRecord, TradeRecord } from '@/types/token.js';

function getRanges() {
    return [
        { id: '1h', label: <Trans>1H</Trans>, days: 1 },
        { id: '24h', label: <Trans>24H</Trans>, days: 1 },
        { id: '7d', label: <Trans>7D</Trans>, days: 7 },
        { id: '1m', label: <Trans>1M</Trans>, days: 30 },
        { id: '1y', label: <Trans>1Y</Trans>, days: 365 },
        { id: 'max', label: <Trans>Max</Trans>, days: undefined },
    ] as const;
}
function wrapLink(node: ReactNode, url: string, enabled: boolean) {
    if (!enabled) return node;
    return (
        <Link prefetch className="contents" href={url}>
            {node}
        </Link>
    );
}

export interface TokenMarketDataProps extends HTMLProps<HTMLDivElement> {
    chainId?: number;
    address?: string;
    tradeRecords?: TradeRecord[];
    token: CoinGeckoToken;
    linkable?: boolean;
    rank?: number;
    range?: string | null;
    traderCount?: number;
    activeTradeHash?: string | null;
    onContractChange?: (contract: Contract) => void;
    onRangeChange?: (range: string) => void;
    onTradeSelect?: (tradeHash: string) => void;
}

export const TokenMarketData = memo(function TokenMarketData({
    chainId: propChainId,
    address: propAddress,
    linkable = false,
    token,
    rank,
    tradeRecords = EMPTY_LIST,
    range,
    traderCount,
    activeTradeHash: propTradeHash,
    onContractChange,
    onRangeChange,
    onTradeSelect,
    ...rest
}: TokenMarketDataProps) {
    const ranges = getRanges();
    const { data: tokenPrice } = useTokenPrice(token.id);
    const { data: coin } = useSingleCoin(token.id, token.chainId, token.address);
    const { data: trending, isPending: isTrendingPending } = useCoinTrending(token.id);
    const runtimeAddress = propAddress || token.address;
    const coinChainId = token.id ? resolveCoinGeckoCoinChainId(token.id) : undefined;
    const contracts = useMemo(() => {
        if (trending?.contracts) {
            const contracts = trending.contracts.filter((x) => TRACING_RUNTIME_LIST.includes(x.runtime));
            if (coinChainId && contracts.length)
                return [
                    {
                        runtime: resolveCoinGeckoChain(coinChainId),
                        chainId: coinChainId,
                        address: ETH_NATIVE_TOKEN_ADDRESS,
                    } as Contract,
                    ...contracts,
                ];
            return contracts;
        }
        if (propChainId && !isZeroAddress(runtimeAddress))
            return [
                {
                    runtime: resolveCoinGeckoChain(propChainId),
                    chainId: propChainId,
                    address: runtimeAddress,
                } as Contract,
            ];
        return EMPTY_LIST;
    }, [coinChainId, propChainId, runtimeAddress, trending?.contracts]);
    const firstContract = first(contracts);
    const chainId = propChainId || token.chainId || firstContract?.chainId;
    const contract = (chainId ? contracts?.find((x) => x.chainId === chainId) : null) || firstContract;
    const address = contract?.address || runtimeAddress; // consistent with contractSelect
    const { data: security } = useTokenSecurity(chainId, address);
    const tradeInfo = useTradeInfo(token, chainId, address);
    const tradeChainId = chainId || tradeInfo.chainId;

    const [activeRecord, setActiveRecord] = useState<PriceRecord>();
    const [pendingTradeHash, setPendingTradeHash] = useState<string>();
    const [rangeId = range, setRangeId] = useState<(typeof ranges)[number]['id']>();
    const currentRange = ranges.find((x) => x.id === rangeId) || ranges[1];

    const { data: priceStats = EMPTY_LIST, isPending } = useCoinPriceStats(
        token.id,
        tradeChainId,
        address,
        currentRange.days,
    );
    const stats = useMemo(
        () => (currentRange.id === '1h' ? priceStats.slice(-12) : priceStats),
        [currentRange.id, priceStats],
    );
    const [tradeDirection, setTradeDirection] = useState<TradeRecord['type']>();
    const withinRangeTradeRecords = useWithinRangeRecords(
        stats,
        tradeRecords,
        tradeDirection,
        currentRange.id === 'max',
    );
    const [activeTradeHash = propTradeHash, setActiveTradeHash] = useState<string>();

    const { isUp, change } = useIsPriceUp(stats, activeRecord);
    const invalidData = useMemo(() => stats.length === 0 || stats.every((item) => isZero(item.value)), [stats]);

    const baseInfo = (
        <>
            <TextOverflowTooltip content={token.name} placement="top">
                <strong className="text-medium text-main ml-0.5 min-w-0 truncate font-bold">{token.name}</strong>
            </TextOverflowTooltip>
            <span className="font-inter text-medium whitespace-nowrap font-bold uppercase">{token.symbol}</span>
        </>
    );

    const handleDotClick = useCallback(
        (tradeHash: string) => {
            setActiveTradeHash(tradeHash);
            onTradeSelect?.(tradeHash);
        },
        [onTradeSelect],
    );

    const tokenRank = rank ?? token.rank;
    const price = tokenPrice ?? coin?.market_data?.token_price_usd ?? token.price;
    const change24h = change ?? coin?.market_data?.price_change_percentage_24h ?? token.changePercent24h;

    const tokenPageUrl = resolveTokenPageUrl({
        identity: token.id || address || token.symbol,
        chainId,
        address,
        isCoinId: !!token.id,
    });

    const twitter_url = trending?.coin.twitter_url;
    const socialLinks = useMemo(() => {
        if (!chainId || !address) return EMPTY_LIST;
        return [
            {
                name: 'explorer',
                url: chainId ? resolveAddressLink(chainId, address) : null,
                icon: GlobalIcon,
            },
            {
                name: 'dex-screener',
                url: chainId ? resolveDexScreenerUrl(chainId, address) : null,
                icon: DexScreenerIcon,
            },
            {
                label: 'twitter',
                url: twitter_url,
                icon: TwitterIcon,
            },
        ].filter((x) => x.url);
    }, [address, chainId, twitter_url]);

    const contractSelect =
        chainId && address ? (
            <div
                className="border-lightLineSecond bg-bg02 text-main mt-0.5 inline-flex h-[30px] w-auto cursor-pointer items-center gap-1 rounded-full border px-2 text-sm"
                data-address={address}
            >
                <div className="inline-flex items-center gap-1">
                    <ChainIcon size={14} chainId={chainId} />
                    {address ? formatAddress(address, 4) : null}
                </div>
                <CopyTextButton
                    text={address}
                    notification="toast"
                    size={14}
                    className="text-main"
                    onClick={stopPropagation}
                />
                {contracts.length > 1 ? <ArrowDownIcon width={14} height={14} className="text-second" /> : null}
            </div>
        ) : null;

    const icon = (
        <TokenIcon
            icon={token.logoURL}
            alt={token.name}
            name={token.name}
            size={36}
            chainId={chainId}
            disableBadge={!!contractSelect}
            coingeckoChain={contract?.runtime}
            className="shrink-0"
        />
    );

    const handleChartMouseLeave = useCallback(() => {
        setActiveRecord(undefined);
    }, []);

    return (
        <div {...rest} className={classNames('flex flex-col gap-1.5 p-3', rest.className)}>
            <div className="flex items-start">
                <div className="flex min-w-0 grow flex-col gap-1.5">
                    <div className="flex min-h-[42px] min-w-0 items-center gap-3">
                        {wrapLink(icon, tokenPageUrl, linkable)}
                        <div className="flex min-w-0 flex-col gap-1">
                            <div className="text-second flex min-w-0 flex-col items-start gap-1 leading-6 md:flex-row md:items-center">
                                <div className="flex w-full items-center gap-1 truncate md:w-auto">
                                    {wrapLink(baseInfo, tokenPageUrl, linkable)}
                                </div>
                                <div className="flex items-center gap-1">
                                    {tokenRank ? (
                                        <span className="bg-highlight inline-flex h-[14px] items-center whitespace-nowrap rounded px-1 py-0.5 text-[10px] text-white">
                                            <Trans>Rank #{tokenRank}</Trans>
                                        </span>
                                    ) : null}
                                    <div className="ml-1 flex items-center gap-1">
                                        {socialLinks.map((link) => (
                                            <Link
                                                key={link.name}
                                                href={link.url!}
                                                target="_blank"
                                                className="bg-input dark:bg-bg inline-flex size-6 items-center justify-center rounded-lg"
                                            >
                                                <link.icon width={16} height={16} />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {traderCount ? (
                                <div className="text-second text-sm leading-[14px]">
                                    <Plural
                                        value={traderCount}
                                        one={
                                            <>
                                                <span className="text-main font-semibold">{traderCount}</span> person I
                                                follow have traded
                                            </>
                                        }
                                        other={
                                            <>
                                                <span className="text-main font-semibold">{traderCount}</span> people I
                                                follow have traded
                                            </>
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-2 empty:hidden">
                            <TokenBookmarkButton coinId={token.id} chainId={chainId || mainnet.id} address={address} />
                        </div>
                    </div>
                    <div className="mt-[18px] flex flex-col gap-2 leading-[22px]">
                        <div className="text-2xl font-bold">
                            ${renderShrankPrice(formatPrice(activeRecord?.value ?? price) ?? '-')}
                        </div>
                        <div className="flex min-h-[22.5px] items-center">
                            {isUp === undefined ? null : (
                                <>
                                    <PriceArrow
                                        width={20}
                                        height={20}
                                        className={isUp ? 'text-success' : 'text-fail rotate-180'}
                                    />
                                    <span className={isUp ? 'text-medium text-success' : 'text-medium text-fail'}>
                                        {isNumber(change24h) ? `${change24h.toFixed(2)}%` : '--%'}
                                    </span>
                                </>
                            )}
                            {activeRecord ? (
                                <span className="text-secondary ml-2 text-sm">
                                    {dayjs(activeRecord.date).format('MMM DD, YYYY, hh:mm A')}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <TokenSecurityBar security={security || undefined} />
                </div>
            </div>
            <div
                className={classNames(
                    'no-scrollbar flex h-[175px] items-center justify-center overflow-auto',
                    isPending ? 'animate-pulse' : null,
                )}
            >
                {isPending ? (
                    <div className="mx-2 h-full grow rounded-lg bg-gray-100 dark:bg-gray-800" />
                ) : invalidData ? (
                    <div className="mx-2 flex h-full grow items-center justify-center rounded-lg">
                        <Trans>There is no data available to display</Trans>
                    </div>
                ) : (
                    <PriceChart
                        className="size-full"
                        records={stats}
                        tradeRecords={withinRangeTradeRecords}
                        activeTradeHash={pendingTradeHash ?? activeTradeHash ?? propTradeHash}
                        onHover={setActiveRecord}
                        onMouseLeave={handleChartMouseLeave}
                        onDotClick={handleDotClick}
                    />
                )}
            </div>
            <div className="flex h-[10px] items-center">
                {withinRangeTradeRecords.length > 1 ? (
                    <div className="no-scrollbar flex grow flex-nowrap gap-1 overflow-auto">
                        {withinRangeTradeRecords.map((trade, i) => {
                            const activeRecordIndex = activeRecord
                                ? withinRangeTradeRecords.findIndex((x) => x.date === activeRecord?.date)
                                : undefined;
                            return (
                                <div
                                    key={i}
                                    className="group min-w-4 max-w-[60px] shrink-0 grow cursor-pointer py-1 first:ml-auto last:mr-auto"
                                    onClick={() => {
                                        setActiveTradeHash((hash) => (trade.hash === hash ? undefined : trade.hash));
                                    }}
                                    onMouseEnter={() => {
                                        setPendingTradeHash(trade.hash);
                                    }}
                                    onMouseLeave={() => {
                                        setPendingTradeHash(undefined);
                                    }}
                                >
                                    <div
                                        className={classNames(
                                            'group-hover:bg-third group-hover:dark:bg-secondary h-[2px] grow cursor-pointer rounded-[2px]',
                                            activeTradeHash === trade.hash || activeRecordIndex === i
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
                                    ? 'light bg-input text-main rounded-[18px] font-bold'
                                    : 'text-secondary bg-transparent',
                            )}
                            key={range.id}
                            onClick={() => {
                                setRangeId(range.id);
                                onRangeChange?.(range.id);
                            }}
                        >
                            {range.label}
                        </ClickableButton>
                    ))}
                </div>
                <div className="ml-auto">
                    <TradeFilter value={tradeDirection} onChange={setTradeDirection} />
                </div>
            </div>
        </div>
    );
});
