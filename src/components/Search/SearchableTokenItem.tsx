import { Trans } from '@lingui/react/macro';
import { type HTMLProps } from 'react';

import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isValidAddress } from '@/helpers/isValidAddress.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import type { TokenWithMarket } from '@/services/searchTokens.js';

interface SearchableTokenItemProps extends HTMLProps<HTMLAnchorElement> {
    token: TokenWithMarket;
    showRate?: boolean;
}

function formatTokenAddress(address: string) {
    return isValidAddress(address) ? formatAddress(address, 4) : `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function SearchableTokenItem({ token, className, showRate = true, onClick }: SearchableTokenItemProps) {
    const priceChange = token.market?.price_change_percentage_24h ?? 0;
    const identityId = token.address || token.api_symbol || token.symbol;
    if (!token.id && !identityId) return null;

    const tokenPageUrl = resolveTokenPageUrl(
        isValidAddress(token.id)
            ? { identity: token.id, chainId: token.chainId }
            : { identity: token.id, isCoinId: true },
    );
    return (
        <Link
            className={classNames('flex items-center gap-x-2 border-b border-line p-3 hover:bg-bg', className)}
            href={tokenPageUrl}
            onClick={onClick}
        >
            <Image
                className="size-11 shrink-0 rounded-full"
                width={44}
                height={44}
                src={token.largeLogo}
                alt={token.symbol}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-1 text-medium font-bold text-secondary">
                    <span className="truncate leading-6 text-lightMain">{token.name}</span>
                    <span>{token.symbol}</span>
                    {token.market_cap_rank ? (
                        <span className="whitespace-nowrap rounded bg-lightBg px-1 py-0.5 text-[10px]">
                            <Trans>Rank #{token.market_cap_rank}</Trans>
                        </span>
                    ) : null}
                </div>
                <div className="flex gap-2">
                    <div className="text-sm leading-[20px] text-second">{token.symbol}</div>
                    {token.address ? (
                        <span
                            className={classNames('truncate text-sm leading-[20px] text-third', bedStead.className)}
                            title={token.address}
                        >
                            {formatTokenAddress(token.address)}
                        </span>
                    ) : null}
                </div>
            </div>
            <div className="flex flex-col justify-end">
                <div className="text-right font-inter text-base font-semibold leading-[24px] text-lightMain">
                    {token.market?.current_price ? (
                        <>${renderShrankPrice(formatPrice(token.market?.current_price) ?? '')}</>
                    ) : (
                        '--'
                    )}
                </div>
                {showRate ? (
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
}
