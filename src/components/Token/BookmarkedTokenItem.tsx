import { type HTMLProps, memo } from 'react';

import { Link } from '@/components/Link.js';
import { TokenBookmarkButton } from '@/components/Token/TokenBookmarkButton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { classNames } from '@/helpers/classNames.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isValidAddress } from '@/helpers/isValidAddress.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { type Bookmarkable, TokenPlatformType, type TokenWithMarketData } from '@/providers/types/Firefly.js';

interface BookmarkedTokenItemProps extends HTMLProps<HTMLAnchorElement> {
    token: Bookmarkable<TokenWithMarketData>;
    showMarketInfo?: boolean;
}

export const BookmarkedTokenItem = memo(function BookmarkedTokenItem({
    token,
    className,
    showMarketInfo,
    onClick,
}: BookmarkedTokenItemProps) {
    const identityId = token.contract_address || token.symbol || token.symbol;
    if (!token.id && !identityId) return null;

    const isCex = token.platform_type
        ? token.platform_type === TokenPlatformType.Cex
        : !!token.id && !isValidAddress(token.id);

    const chainId = token.chain_id || token.platform_info[0].chain_id;
    const address = token.contract_address || token.platform_info[0].token_address;
    const tokenPageUrl = resolveTokenPageUrl(
        isValidAddress(token.id)
            ? { identity: token.id, chainId }
            : { identity: token.id, isCoinId: true, chainId: isCex ? undefined : chainId },
    );
    const priceChange = token.market_data?.price_change_percentage_24h ?? 0;
    return (
        <Link
            className={classNames('flex items-center gap-3 px-2 py-3 hover:bg-bg', className)}
            href={tokenPageUrl}
            onClick={onClick}
        >
            <TokenBookmarkButton
                coinId={token.id}
                chainId={chainId}
                address={address}
                bookmarked
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
            />
            <TokenIcon
                className="size-11 shrink-0 rounded-full"
                size={44}
                badgeSize={17}
                chainId={chainId}
                address={address}
                icon={token.image.small}
                disableBadge={isCex}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-1 text-medium font-bold text-secondary">
                    <span className="truncate leading-6 text-lightMain">{token.name}</span>
                </div>
                {showMarketInfo ? (
                    <div className="flex gap-2">
                        {token.market_data?.volume_usd_24h ? (
                            <span className="text-sm leading-[20px] text-second">
                                ${nFormatter(token.market_data.volume_usd_24h)}
                            </span>
                        ) : null}
                        {token.market_data?.volume_usd_24h && token.market_data?.market_cap_usd ? <span>·</span> : null}
                        {token.market_data?.market_cap_usd ? (
                            <span className="text-sm leading-[20px] text-second">
                                ${nFormatter(token.market_data.market_cap_usd)}
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </div>
            <div className="flex flex-col justify-end gap-0.5">
                <div className="text-right font-inter text-base font-semibold leading-[14px] text-lightMain">
                    {token.market_data?.token_price_usd ? (
                        <>${renderShrankPrice(formatPrice(token.market_data?.token_price_usd) ?? '')}</>
                    ) : (
                        <span className="text-third">--</span>
                    )}
                </div>
                <data
                    className={classNames(
                        'flex h-3 shrink-0 items-center justify-end gap-1 text-right font-inter text-xs font-medium max-md:w-auto max-md:min-w-[60px] max-md:px-2 max-md:text-[15px] max-md:leading-3',
                        priceChange >= 0 ? 'text-success' : 'text-danger',
                    )}
                >
                    {priceChange !== 0 ? (priceChange > 0 ? '↑ ' : '↓ ') : null}
                    {priceChange.toFixed(1).replace('-', '')}%
                </data>
            </div>
        </Link>
    );
});
