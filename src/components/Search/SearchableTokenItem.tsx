import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo } from 'react';

import { Link } from '@/components/Link.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isValidAddress } from '@/helpers/isValidAddress.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { TokenPlatformType } from '@/providers/types/Firefly.js';
import type { TokenWithMarket } from '@/services/searchTokens.js';

interface SearchableTokenItemProps extends HTMLProps<HTMLAnchorElement> {
    token: TokenWithMarket;
    showChange?: boolean;
    showSymbol?: boolean;
    showRank?: boolean;
    showMarketInfo?: boolean;
}

function formatTokenAddress(address: string) {
    return isValidAddress(address) ? formatAddress(address, 4) : `${address.slice(0, 6)}...${address.slice(-4)}`;
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
                return FireflyEndpointProvider.getTokenByCoinId(token.id);
            } else if (token.chainId && token.address) {
                return FireflyEndpointProvider.getTokenByAddress(token.chainId, token.address);
            }
            return null;
        },
    });

    if (!token.id && !identityId) return null;

    const tokenPageUrl = resolveTokenPageUrl(
        isValidAddress(token.id)
            ? { identity: token.id, chainId: token.chainId }
            : { identity: token.id, isCoinId: true, chainId: isCex ? undefined : token.chainId },
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
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-1 text-medium font-bold text-secondary">
                    <span className="truncate leading-6 text-lightMain">{token.name}</span>
                    {showSymbol ? <span>{token.symbol}</span> : null}
                    {showRank && token.market_cap_rank && token.market_cap_rank <= MAX_TOP_TOKENS ? (
                        <span className="whitespace-nowrap rounded bg-lightBg px-1 py-0.5 text-[10px]">
                            <Trans>Rank #{token.market_cap_rank}</Trans>
                        </span>
                    ) : null}
                </div>
                <div className="flex gap-2">
                    {showSymbol ? <div className="text-sm leading-[20px] text-second">{token.symbol}</div> : null}
                    {token.address && !isCex ? (
                        <span
                            className={classNames('truncate text-sm leading-[20px] text-third', bedStead.className)}
                            title={token.address}
                        >
                            {formatTokenAddress(token.address)}
                        </span>
                    ) : null}
                    {showMarketInfo && tokenWithMarket ? (
                        <div className="flex gap-2">
                            {tokenWithMarket.market_data?.volume_usd_24h ? (
                                <span className="text-sm leading-[20px] text-second">
                                    ${nFormatter(tokenWithMarket.market_data.volume_usd_24h)}
                                </span>
                            ) : null}
                            {tokenWithMarket.market_data?.volume_usd_24h &&
                            tokenWithMarket.market_data?.market_cap_usd ? (
                                <span>·</span>
                            ) : null}
                            {tokenWithMarket.market_data?.market_cap_usd ? (
                                <span className="text-sm leading-[20px] text-second">
                                    ${nFormatter(tokenWithMarket.market_data.market_cap_usd)}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
            <div className="flex flex-col justify-end">
                <div className="text-right font-inter text-base font-semibold leading-[24px] text-lightMain">
                    {token.market?.current_price ? (
                        <>${renderShrankPrice(formatPrice(token.market.current_price) ?? '')}</>
                    ) : (
                        <span className="text-third">--</span>
                    )}
                </div>
                {showChange ? (
                    <data
                        className={classNames(
                            'flex h-8 shrink-0 items-center justify-end gap-1 text-right font-inter text-sm font-medium max-md:h-[30px] max-md:w-auto max-md:min-w-[60px] max-md:px-2 max-md:text-[15px] max-md:leading-[15px]',
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
