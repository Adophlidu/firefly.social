'use client';

import LineArrowUp from '@dimensiondev/assets/line-arrow-up.svg';
import PriceArrow from '@dimensiondev/assets/price-arrow.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { formatAddress, isSameAddress } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { isNumber, uniq } from 'lodash-es';
import { type HTMLProps, memo, useMemo, useState } from 'react';

import { CopyTextButton } from '@/components/CopyTextButton.js';
import { SecurityBadge } from '@/components/EmbedCards/TokenSecurityBadge.js';
import { Link } from '@/components/Link.js';
import { SimplePriceChart } from '@/components/PriceChart/SimplePriceChart.js';
import { TokenSwitcher } from '@/components/Token/TokenSwitcher.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { useTradeInfo } from '@/components/TokenProfile/useTradeInfo.js';
import { formatMarketCap } from '@/helpers/formatMarketCap.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useCoinPrice24hStats } from '@/hooks/useCoinPriceStats.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useTokenCoin } from '@/hooks/useTokenCoin.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import { useTokenSecurity } from '@/hooks/useTokenSecurity.js';
import { searchTokenInfos } from '@/providers/firefly/endpoint/searchTokenInfos.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';

export function TokenProfileCardSkeleton(props: HTMLProps<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={classNames(
                'border-line bg-primaryBottom cursor-default rounded-2xl border p-3',
                props.className,
            )}
        >
            <div className="flex animate-pulse flex-col gap-3">
                <div className="flex items-center">
                    <div className="bg-bg size-8 rounded-full" />
                    <div className="ml-3 flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                            <div className="bg-bg h-3 w-10 rounded py-0.5" />
                            <span className="bg-bg size-3 rounded-full" />
                        </div>
                        <div className="flex items-center gap-1 leading-4">
                            <span className="bg-bg h-3 w-20 py-0.5" />
                        </div>
                    </div>
                    <div className="ml-auto flex items-center justify-end gap-1 self-start">
                        <div className="bg-bg text-main h-[18px] w-[130px] rounded" />
                    </div>
                </div>
                <div className="flex h-10 items-center">
                    <div className="flex items-center gap-1 leading-[22px]">
                        <strong className="bg-bg h-[22px] w-20 rounded" />
                        <span className="bg-bg text-medium text-secondary h-4 w-6" title={t`Market Cap`} />
                        <span className="bg-bg inline-flex h-[14px] w-12 items-center text-nowrap rounded px-1 py-0.5" />
                    </div>
                    <div className="bg-bg ml-auto h-8 w-[170px] overflow-auto rounded" />
                </div>
                <div className="flex items-center">
                    <div className="text-medium flex h-8 items-center gap-1 leading-[22px]">
                        <span className="bg-bg h-3 w-10 rounded py-0.5" />
                        <span className="bg-bg h-3 w-20 rounded py-0.5" />
                        <span className="bg-bg h-3 w-10 rounded py-0.5" />
                    </div>
                    <div className="bg-bg row-start-3 ml-auto flex h-8 w-[80px] items-center justify-end rounded-full" />
                </div>
            </div>
        </div>
    );
}

interface Props extends HTMLProps<HTMLDivElement> {
    symbol: string;
}

export const TokenProfileCard = memo<Props>(function TokenProfileCard({ symbol, children, ...rest }) {
    const [openSwitcher, setOpenSwitcher] = useState(false);
    const { data: tokenInfos = EMPTY_LIST, isLoading } = useQuery({
        queryKey: ['search-token', symbol],
        queryFn: () => searchTokenInfos(symbol),
    });
    const [coin, setCoin] = useTokenCoin(symbol);
    const selectedToken = useMemo(() => {
        if (!coin) return tokenInfos[0];

        const matched = tokenInfos.find(
            (x) =>
                x.id === coin.id && x.chain === coin.chain && isSameAddress(x.contract_address, coin.contract_address),
        );
        return matched || tokenInfos[0];
    }, [coin, tokenInfos]);
    const chainCount = uniq(tokenInfos.map((x) => x.chain_id)).length;

    const address = selectedToken?.contract_address;
    const { data: detected } = useQuery({
        queryKey: ['detect-address', address?.toLowerCase()],
        queryFn: () => fireflyWalletProvider.detectAddress(address),
        select: (data) => {
            if (!data) return;
            const tokens = data.list.filter((x) => {
                const isToken =
                    (x.type === 'eth' && x.contract_type === 'ERC20') ||
                    (x.type === 'solana' && x.contract_type === 'token');
                if (!isToken) return false;
                return x.contract_info?.attributes.symbol.toLowerCase() === symbol.toLowerCase();
            });
            return tokens[0];
        },
    });
    const attributes = detected?.contract_info?.attributes;
    const coingeckoCoinId = selectedToken?.id || attributes?.coingecko_coin_id;
    const hasCoinId = !!coingeckoCoinId;

    const { data: token } = useTokenInfo({ coingecko_id: coingeckoCoinId, address });
    const { data: trending } = useCoinTrending(token?.id);
    const tradeInfo = useTradeInfo(token);

    const chainId = detected?.chain_id ? +detected.chain_id : tradeInfo.chainId;
    const {
        priceStats,
        isPending,
        isUp: statsIsUp,
    } = useCoinPrice24hStats(coingeckoCoinId || token?.id, chainId, address);

    const { data: tokenSecurity } = useTokenSecurity(chainId, address);

    if (isLoading) return <TokenProfileCardSkeleton {...rest} />;

    if (!selectedToken) return null;
    const market_data = selectedToken.market_data;
    if (!market_data) return null;

    const price = market_data.token_price_usd ?? trending?.market?.current_price;
    const changePercent = market_data.price_change_percentage_24h ?? trending?.market?.price_change_percentage_24h;
    const isUp = statsIsUp ?? (isNumber(changePercent) ? changePercent > 0 : undefined);
    const market_cap = market_data.market_cap_usd;
    const tokenPageUrl = resolveTokenPageUrl({
        identity: coingeckoCoinId || selectedToken.symbol,
        chainId: selectedToken.chain_id,
        address: coingeckoCoinId ? undefined : selectedToken.contract_address,
        isCoinId: hasCoinId,
    });

    const rank = token?.rank || trending?.coin.market_cap_rank;

    if (openSwitcher) {
        return (
            <TokenSwitcher
                {...rest}
                platformType={selectedToken.platform_type}
                onClose={() => setOpenSwitcher(false)}
                tokenInfos={tokenInfos}
                onSelect={(tokenInfo) => {
                    setCoin(symbol, tokenInfo);
                }}
            />
        );
    }

    return (
        <div
            {...rest}
            className={classNames(
                'border-line bg-primaryBottom flex cursor-default flex-col gap-3 rounded-2xl border p-3',
                rest.className,
            )}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <div className="flex items-center">
                <Link href={tokenPageUrl}>
                    <TokenIcon
                        icon={selectedToken.image.large}
                        chainId={chainId}
                        alt={selectedToken.name}
                        name={selectedToken.name}
                        size={32}
                        disableBadge={chainCount > 1}
                    />
                </Link>
                <div className="ml-3 flex flex-col">
                    <div className="flex items-center gap-1">
                        <Link
                            className="text-main text-base font-bold uppercase leading-4 hover:underline"
                            href={tokenPageUrl}
                        >
                            {selectedToken.symbol}
                        </Link>
                        {tokenSecurity ? <SecurityBadge security={tokenSecurity} interactive={false} /> : null}
                    </div>
                    {chainCount === 1 ? (
                        <div className="flex items-center gap-1 leading-4">
                            <span className="font-inter text-third max-w-28 truncate text-[13px] font-bold leading-4">
                                {formatAddress(address, 4)}
                            </span>
                            {address ? <CopyTextButton text={address} className="text-third leading-4" /> : null}
                        </div>
                    ) : null}
                </div>
                {tokenInfos.length > 1 ? (
                    <div
                        className="ml-auto flex cursor-pointer items-center gap-1 self-start"
                        onClick={() => setOpenSwitcher(true)}
                    >
                        <div className="text-main text-sm font-bold leading-[18px]">
                            <Trans>View similar symbols</Trans>
                        </div>
                        <LineArrowUp className="rotate-180" width={20} height={20} />
                    </div>
                ) : null}
            </div>
            <div className="flex items-center">
                <div className="flex items-center gap-1 leading-[22px]">
                    <Trans>
                        <strong className="text-2xl font-bold leading-[22px]">
                            {market_cap ? `$${formatMarketCap(market_cap)}` : '-'}
                        </strong>
                        <span className="text-medium text-secondary" title={t`Market Cap`}>
                            MC
                        </span>
                        {rank ? (
                            <span className="bg-highlight inline-flex h-[14px] items-center text-nowrap rounded px-1 py-0.5 text-[10px] text-white">
                                Rank #{rank}
                            </span>
                        ) : null}
                    </Trans>
                </div>
                <div
                    className={classNames(
                        'ml-auto h-10 min-w-[150px] max-w-[170px] shrink-0 grow overflow-auto',
                        isPending ? 'animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800' : null,
                    )}
                >
                    <SimplePriceChart records={priceStats} className="size-full" />
                </div>
            </div>
            <div className="flex items-center">
                <div className="text-medium flex h-8 items-center gap-1 leading-[22px]">
                    {typeof changePercent === 'number' ? (
                        <>
                            <PriceArrow
                                width={16}
                                height={16}
                                className={isUp ? 'text-success shrink-0' : 'text-fail shrink-0 rotate-180'}
                            />
                            <span className={isUp ? 'text-success text-xs' : 'text-fail text-xs'}>
                                {changePercent.toFixed(2)}%
                            </span>
                        </>
                    ) : (
                        <span>--</span>
                    )}
                    <Trans>
                        <span className="text-medium text-secondary">today</span>
                        <strong className="text-medium font-bold">
                            ${renderShrankPrice(formatPrice(price) ?? '-')}
                        </strong>
                    </Trans>
                </div>
                {address && detected?.chain_id && tradeInfo.tradable && detected?.type === 'eth' ? (
                    <div className="ml-auto flex items-center justify-end">
                        <SwapButton
                            className="flex shrink-0 grow-0 flex-row-reverse !gap-1 !px-3 !py-2"
                            swapProps={{
                                chainId: +detected.chain_id,
                                toToken: address,
                            }}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
});
