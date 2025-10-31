import { classNames } from '@firefly/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import PriceArrow from '@/assets/price-arrow.svg';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { SecurityBadge } from '@/components/EmbedCards/TokenSecurityBadge.js';
import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { Link } from '@/components/Link.js';
import { SimplePriceChart } from '@/components/PriceChart/SimplePriceChart.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { useTradeInfo } from '@/components/TokenProfile/useTradeInfo.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatMarketCap } from '@/helpers/formatMarketCap.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useCoinPrice24hStats } from '@/hooks/useCoinPriceStats.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useDetectToken } from '@/hooks/useDetectToken.js';
import { useSingleCoin } from '@/hooks/useSingleCoin.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import { useTokenSecurity } from '@/hooks/useTokenSecurity.js';

export const TokenCard = memo<AddressCardProps>(function TokenCard({ address, ...rest }) {
    const { data: detected } = useDetectToken(address);
    const attributes = detected?.contract_info?.attributes;
    const coingecko_coin_id = attributes?.coingecko_coin_id;

    const { data: token } = useTokenInfo({ coingecko_id: coingecko_coin_id, address });
    const { data: trending } = useCoinTrending(token?.id);
    const tradeInfo = useTradeInfo(token);

    const market = trending?.market;

    const chainId = detected?.chain_id ? +detected.chain_id : tradeInfo.chainId;
    const { data: coin } = useSingleCoin(token?.id, chainId, address);
    const { priceStats, isPending, isUp } = useCoinPrice24hStats(coingecko_coin_id || token?.id, chainId, address);

    const { data: tokenSecurity } = useTokenSecurity(chainId, address);

    if (!token) return null;
    const price = attributes?.price_usd ?? coin?.market_data?.token_price_usd;
    const market_cap = attributes?.market_cap_usd;
    const tokenPageUrl = resolveTokenPageUrl({ identity: token.symbol, chainId });

    const rank = token.rank || trending?.coin.market_cap_rank;
    return (
        <>
            <div
                {...rest}
                className={classNames(
                    'flex cursor-default flex-col rounded-2xl border border-line bg-lightBg px-3 py-[7px]',
                    rest.className,
                )}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <div className="flex h-[47.5px] items-center">
                    <div className="flex items-center gap-2 whitespace-nowrap text-second">
                        <Link href={tokenPageUrl}>
                            <TokenIcon
                                icon={token.logoURL}
                                chainId={chainId}
                                alt={token.name}
                                name={token.name}
                                width={30}
                                height={30}
                            />
                        </Link>
                        <Link
                            className="ml-[2px] text-lg font-bold uppercase text-main hover:underline"
                            href={tokenPageUrl}
                        >
                            {token.symbol}
                        </Link>
                        {tokenSecurity ? <SecurityBadge security={tokenSecurity} /> : null}
                        <span className="max-w-28 truncate font-inter text-sm font-bold text-third">
                            {formatAddress(address, 4)}
                        </span>
                        <CopyTextButton text={address} />
                    </div>
                    {attributes?.address && tradeInfo.tradable && detected?.type === 'eth' ? (
                        <SwapButton
                            className="flex shrink-0 grow-0 flex-row-reverse !gap-1 !px-3 !py-2"
                            swapProps={
                                detected?.chain_id
                                    ? {
                                          chainId: +detected.chain_id,
                                          chainIds: tradeInfo.supportedChainIds?.map((x) => x.toString()),
                                          toToken: attributes.address,
                                      }
                                    : undefined
                            }
                        />
                    ) : null}
                </div>
                <div className="flex">
                    <div className="flex flex-col gap-1">
                        <div className="flex min-h-[22px] items-center gap-1 leading-[22px]">
                            {market_cap ? (
                                <Trans>
                                    <strong className="text-2xl font-bold leading-[22px]">
                                        {market_cap ? `$${formatMarketCap(market_cap)}` : '-'}
                                    </strong>
                                    <span className="text-medium text-secondary" title={t`Market Cap`}>
                                        MC
                                    </span>
                                    {rank ? (
                                        <span className="inline-flex h-[14px] items-center rounded bg-highlight px-1 py-0.5 text-[10px] text-white">
                                            Rank #{rank}
                                        </span>
                                    ) : null}
                                </Trans>
                            ) : null}
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
                            'ml-auto max-h-[48px] max-w-[180px] overflow-auto',
                            isPending ? 'animate-pulse' : null,
                        )}
                    >
                        <SimplePriceChart records={priceStats} className="size-full" />
                    </div>
                </div>
            </div>
        </>
    );
});
