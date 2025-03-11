import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useContext, useRef } from 'react';

import PriceArrow from '@/assets/price-arrow.svg';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { SecurityBadge } from '@/components/EmbedCards/TokenSecurityBadge.js';
import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { SwapModal } from '@/components/SwapModal/index.js';
import { TokenContext } from '@/components/Token/TokenContext.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { useTradeInfo } from '@/components/TokenProfile/useTradeInfo.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatMarketCap } from '@/helpers/formatMarketCap.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { useCoinPrice24hStats } from '@/hooks/useCoinPriceStats.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import type { Dimension } from '@/hooks/useLineChart.js';
import { usePriceLineChart } from '@/hooks/usePriceLineChart.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import { useTokenSecurity } from '@/hooks/useTokenSecurity.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

const DIMENSION: Dimension = {
    top: 12,
    right: 0,
    bottom: 12,
    left: 0,
    width: 170,
    height: 80,
};

export const TokenCard = memo<AddressCardProps>(function TokenCard({ address, children, ...rest }) {
    const chartRef = useRef<SVGSVGElement>(null);
    const { data: detected } = useQuery({
        queryKey: ['detect-address', address],
        queryFn: () => FireflyEndpointProvider.detectAddress(address),
        select: (data) => {
            const tokens = data.list.filter((x) => {
                return (
                    (x.type === 'eth' && x.contract_type === 'ERC20') ||
                    (x.type === 'solana' && x.contract_type === 'token')
                );
            });
            return tokens[0];
        },
    });
    const attributes = detected?.contract_info?.attributes;
    const coingecko_coin_id = attributes?.coingecko_coin_id;

    const { data: token } = useTokenInfo(coingecko_coin_id || address, !!coingecko_coin_id);
    const { data: trending } = useCoinTrending(token?.id);
    const { openTrader, setOpenTrader, setTradable } = useContext(TokenContext);
    const tradeInfo = useTradeInfo(token);
    setTradable(tradeInfo.tradable);

    const market = trending?.market;

    const { priceStats, isPending, isUp } = useCoinPrice24hStats(coingecko_coin_id || token?.id);

    usePriceLineChart(chartRef, priceStats, DIMENSION, `token-card-price-chart-${address}`, {
        simple: true,
    });
    const chainId = detected?.chain_id ? +detected.chain_id : tradeInfo.chainId;

    const { data: tokenSecurity } = useTokenSecurity(chainId, address);

    if (!token) return <div className="min-h-[80px] animate-pulse" />;
    const price = attributes?.price_usd;
    const market_cap = attributes?.market_cap_usd;

    return (
        <>
            <div
                {...rest}
                className={classNames(
                    'flex items-center gap-1.5 rounded-2xl border border-line bg-bg p-3',
                    rest.className,
                )}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 whitespace-nowrap text-second">
                        <TokenIcon icon={token.logoURL} chainId={chainId} alt={token.name} width={30} height={30} />
                        <strong className="ml-[2px] text-lg font-bold uppercase text-main">{token.symbol}</strong>
                        {tokenSecurity ? <SecurityBadge security={tokenSecurity} /> : null}
                        <span className="truncate font-inter text-medium font-bold">{formatAddress(address, 4)}</span>
                        <CopyTextButton text={address} />
                    </div>
                    <div className="line-height-[22px] flex items-center gap-1">
                        <Trans>
                            <strong className="text-medium font-bold">
                                {market_cap !== undefined ? `$${formatMarketCap(market_cap)}` : '-'}
                            </strong>
                            <span className="text-medium text-secondary" title={t`Market Cap`}>
                                MC
                            </span>
                            <span className="inline-flex h-[14px] items-center rounded bg-highlight px-1 py-0.5 text-[10px] text-white">
                                Rank #{token.rank}
                            </span>
                        </Trans>
                    </div>
                    <div className="line-height-[22px] flex items-center gap-1 text-medium">
                        <Trans>
                            <PriceArrow
                                width={16}
                                height={16}
                                className={isUp ? 'shrink-0 text-success' : 'shrink-0 rotate-180 text-fail'}
                            />
                            {market?.price_change_percentage_24h_in_currency !== undefined ? (
                                <span className={isUp ? 'text-success' : 'text-fail'}>
                                    {market.price_change_percentage_24h_in_currency.toFixed(2)}%
                                </span>
                            ) : null}
                            <span className="text-medium text-secondary">today</span>
                            <strong className="font-bold">${renderShrankPrice(formatPrice(price) ?? '-')}</strong>
                        </Trans>
                    </div>
                </div>
                <div
                    className={classNames(
                        'min-w-[50px] max-w-[170px] overflow-auto',
                        isPending ? 'animate-pulse' : null,
                    )}
                >
                    <svg ref={chartRef} key={address} width="100%" className="aspect-[17/8]" viewBox="0 0 170 80" />
                </div>
                <SwapButton className="ml-auto inline-flex shrink-0 grow-0 flex-row-reverse !gap-1 !px-3 !py-2" />
            </div>

            {openTrader && tradeInfo.tradable ? (
                <SwapModal
                    open
                    chainId={tradeInfo.chainId}
                    chainIds={tradeInfo.supportedChainIds}
                    address={tradeInfo.address!}
                    onClose={() => {
                        setOpenTrader(false);
                    }}
                />
            ) : null}
        </>
    );
});
