'use client';

import { TokenPlatformType } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { formatTokenAddress, isValidAddress } from '@dimensiondev/web3/utils';
import type { TokenWithMarket } from '@dimensiondev/workers-token';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo } from 'react';

import { Link } from '@/components/Link.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { getSingleCoin } from '@/providers/firefly/endpoint/getSingleCoin.js';

interface SearchableTokenItemProps extends HTMLProps<HTMLAnchorElement> {
    token: TokenWithMarket;
    showChange?: boolean;
    showSymbol?: boolean;
    showRank?: boolean;
    showMarketInfo?: boolean;
}

const MAX_TOP_TOKENS = 500;

export const SearchableTokenItem = memo(function SearchableTokenItem({
    token,
    className,
    showChange = true,
    showSymbol = true,
    showRank = true,
    showMarketInfo,
    onClick,
}: SearchableTokenItemProps) {
    const priceChange = token.market?.price_change_percentage_24h ?? 0;
    const identityId = token.address || token.api_symbol || token.symbol;
    const isCex = token.platform_type
        ? token.platform_type === TokenPlatformType.Cex
        : !!token.id && !isValidAddress(token.id);

    const { data: tokenWithMarket } = useQuery({
        enabled: !!showMarketInfo,
        queryKey: isCex
            ? ['token', 'with-market-data', token.id]
            : ['token', 'with-market-data', token.chainId, token.address],
        queryFn: async () => {
            if (isCex) {
                return getSingleCoin({
                    coingecko_id: token.id,
                });
            } else if (token.chainId && token.address) {
                return getSingleCoin({
                    address: token.address,
                    chain_id: token.chainId,
                });
            }
            return null;
        },
    });

    if (!token.id && !identityId) return null;

    const tokenPageUrl = resolveTokenPageUrl(
        isValidAddress(token.id)
            ? { identity: token.id as string, chainId: token.chainId }
            : { identity: token.id || identityId, isCoinId: true, chainId: isCex ? undefined : token.chainId },
    );

    return (
        <Link
            className={classNames('flex items-center gap-3 p-3 hover:bg-bg', className)}
            href={tokenPageUrl}
            onClick={onClick}
        >
            <TokenIcon
                className="size-11 shrink-0 rounded-full"
                size={44}
                badgeSize={17}
                chainId={token.chainId}
                address={token.address}
                icon={token.largeLogo}
                disableBadge={isCex}
                name={token.name}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-1 text-medium font-bold text-secondary">
                    <span className="inline-block truncate leading-6 text-lightMain">{token.name}</span>
                    {showSymbol ? <span className="whitespace-nowrap">{token.symbol}</span> : null}
                    {showRank && token.market_cap_rank && token.market_cap_rank <= MAX_TOP_TOKENS ? (
                        <span className="whitespace-nowrap rounded bg-lightBg px-1 py-0.5 text-[10px]">
                            <Trans>Rank #{token.market_cap_rank}</Trans>
                        </span>
                    ) : null}
                </div>
                <div className="flex gap-2">
                    {showSymbol ? <div className="text-sm leading-5 text-second">{token.symbol}</div> : null}
                    {token.address && !isCex ? (
                        <span
                            className={classNames('truncate text-sm leading-5 text-third', bedStead.className)}
                            title={token.address}
                        >
                            {formatTokenAddress(token.address)}
                        </span>
                    ) : null}
                    {showMarketInfo && tokenWithMarket ? (
                        <div className="flex gap-2">
                            <span className="text-sm leading-5 text-second">
                                {tokenWithMarket.market_data?.volume_usd_24h
                                    ? `$${nFormatter(tokenWithMarket.market_data.volume_usd_24h)}`
                                    : '-'}
                            </span>
                            <span className="text-sm leading-5 text-second">·</span>
                            <span className="text-sm leading-5 text-second">
                                {tokenWithMarket.market_data?.market_cap_usd
                                    ? `$${nFormatter(tokenWithMarket.market_data.market_cap_usd)}`
                                    : '-'}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>
            <div className="flex flex-col justify-end">
                <div className="text-right font-inter text-base font-semibold leading-6 text-lightMain">
                    {token.market?.current_price ? (
                        <>${renderShrankPrice(formatPrice(token.market.current_price) ?? '')}</>
                    ) : (
                        <span className="text-third">--</span>
                    )}
                </div>
                {showChange ? (
                    <data
                        className={classNames(
                            'flex h-5 shrink-0 items-center justify-end gap-1 text-right font-inter text-sm font-medium max-md:w-auto max-md:min-w-[60px] max-md:px-2',
                            priceChange >= 0 ? 'text-success' : 'text-danger',
                        )}
                    >
                        {priceChange !== 0 ? (priceChange > 0 ? '↑ ' : '↓ ') : null}
                        {priceChange.toFixed(1).replace('-', '')}%
                    </data>
                ) : null}
            </div>
        </Link>
    );
});
