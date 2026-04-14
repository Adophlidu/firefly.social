import { classNames } from '@dimensiondev/utils';
import { isValidAddress } from '@dimensiondev/web3-utils';
import { type HTMLProps, memo } from 'react';

import { Link } from '@/components/Link.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { TokenBookmarkButton } from '@/components/Token/TokenBookmarkButton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
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
}: BookmarkedTokenItemProps) {
    const identityId = token.contract_address || token.symbol || token.symbol;
    if (!token.id && !identityId) return null;

    const isCex = token.platform_type
        ? token.platform_type === TokenPlatformType.Cex
        : !!token.id && !isValidAddress(token.id);

    const chainId = token.chain_id || token.platform_info?.[0]?.chain_id;
    const address = token.contract_address || token.platform_info?.[0]?.token_address;
    const tokenPageUrl = resolveTokenPageUrl({
        identity: token.id,
        isCoinId: isCex,
        chainId,
        address,
    });
    const priceChange = token.market_data?.price_change_percentage_24h ?? 0;
    return (
        <div className={classNames('hover:bg-bg flex items-center gap-3 px-2 py-3', className)}>
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
            <Link className="flex min-w-0 grow items-center gap-3" shallow href={tokenPageUrl}>
                <TokenIcon
                    className="size-11 shrink-0 rounded-full"
                    size={44}
                    badgeSize={17}
                    chainId={chainId}
                    address={address}
                    icon={token.image.large || token.image.small}
                    disableBadge={isCex}
                    name={token.name}
                />
                <div className="min-w-0 flex-1">
                    <div className="text-medium text-secondary flex items-center gap-x-1 font-bold">
                        <TextOverflowTooltip content={token.name}>
                            <span className="text-lightMain truncate leading-6">{token.name}</span>
                        </TextOverflowTooltip>
                    </div>
                    {showMarketInfo ? (
                        <div className="flex gap-2">
                            {token.market_data?.volume_usd_24h ? (
                                <span className="text-second text-sm leading-5">
                                    ${nFormatter(token.market_data.volume_usd_24h)}
                                </span>
                            ) : null}
                            {token.market_data?.volume_usd_24h && token.market_data.market_cap_usd ? (
                                <span>·</span>
                            ) : null}
                            {token.market_data?.market_cap_usd ? (
                                <span className="text-second text-sm leading-5">
                                    ${nFormatter(token.market_data.market_cap_usd)}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                <div className="flex flex-col justify-end">
                    <div className="font-inter text-lightMain text-right text-base font-semibold leading-6">
                        {token.market_data?.token_price_usd ? (
                            <>${renderShrankPrice(formatPrice(token.market_data.token_price_usd) ?? '')}</>
                        ) : (
                            <span className="text-third">--</span>
                        )}
                    </div>
                    <data
                        className={classNames(
                            'font-inter flex h-5 shrink-0 items-center justify-end gap-1 text-right text-sm font-medium max-md:w-auto max-md:min-w-[60px]',
                            priceChange >= 0 ? 'text-success' : 'text-danger',
                        )}
                    >
                        {priceChange !== 0 ? (priceChange > 0 ? '↑ ' : '↓ ') : null}
                        {priceChange.toFixed(1).replace('-', '')}%
                    </data>
                </div>
            </Link>
        </div>
    );
});
