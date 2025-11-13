'use client';

import { classNames } from '@dimensiondev/utils';

import { Link } from '@/components/Link.js';
import { TokenIcon } from '@/components/Tips/TokenIcon.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';

export interface TokenTrendingData {
    symbol: string;
    logo: string;
    chainId: number;
    address: string;
    volume?: string;
    marketCap: string | null;
    price?: string;
    priceChange?: number;
    coinId?: string;
}

export function TokenTrendingListItem({ data }: { data: TokenTrendingData }) {
    const tokenPageUrl = resolveTokenPageUrl({ identity: data.address, chainId: data.chainId });
    const token = {
        id: data.coinId ?? data.address,
        chainId: data.chainId,
        address: data.address,
        symbol: data.symbol,
        logo: data.logo,
        name: data.symbol,
        logo_url: data.logo,
    };
    return (
        <Link className="flex items-center gap-3 border-b border-line p-4 hover:bg-bg" href={tokenPageUrl}>
            <TokenIcon
                className="size-11 shrink-0 rounded-full"
                size={44}
                badgeSize={17}
                chainId={data.chainId}
                address={data.address}
                icon={data.logo}
                token={token}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-base font-semibold leading-6 text-lightMain">{data.symbol}</span>
                </div>
                <div className="flex gap-2">
                    {data.volume ? (
                        <span className="text-sm leading-5 text-second">${nFormatter(Number(data.volume))}</span>
                    ) : (
                        '-'
                    )}
                    <span>·</span>
                    {data.marketCap ? (
                        <span className="text-sm leading-5 text-second">${nFormatter(Number(data.marketCap))}</span>
                    ) : (
                        '-'
                    )}
                </div>
            </div>
            <div className="flex flex-col justify-end">
                <div className="text-right font-inter text-base font-semibold leading-6 text-lightMain">
                    {data.price ? `$${renderShrankPrice(formatPrice(data.price) ?? '')}` : ''}
                </div>
                {data.priceChange ? (
                    <data
                        className={classNames(
                            'flex h-5 shrink-0 items-center justify-end gap-1 text-right font-inter text-sm font-medium max-md:w-auto max-md:min-w-[60px]',
                            Number(data.priceChange) >= 0 ? 'text-success' : 'text-danger',
                        )}
                    >
                        {data.priceChange !== 0 ? (data.priceChange > 0 ? '↑ ' : '↓ ') : null}
                        {data.priceChange.toFixed(1).replace('-', '')}%
                    </data>
                ) : null}
            </div>
        </Link>
    );
}
