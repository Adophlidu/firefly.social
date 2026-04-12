'use client';

import LinkIcon from '@dimensiondev/assets/link-square.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames, parseUrl } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Link } from '@/components/Link.js';
import { Loading } from '@/components/Loading.js';
import { ClubLink } from '@/components/TokenProfile/CommunityLink.js';
import { InfoCard } from '@/components/TokenProfile/TokenOverview/InfoCard.js';
import { InfoRow } from '@/components/TokenProfile/TokenOverview/InfoRow.js';
import { Tooltip } from '@/components/Tooltip.js';
import { Link as OriginalLink } from '@/esm/Link.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatAge } from '@/helpers/formatAge.js';
import { formatMarketCap } from '@/helpers/formatMarketCap.js';
import { formatDate } from '@/helpers/formatTimestamp.js';
import { resolveAddressLink } from '@/helpers/resolveExplorer.js';
import { getDexCoinDetail } from '@/providers/firefly/endpoint/getDexCoinDetail.js';
import type { ClubUrl } from '@/providers/types/Trending.js';

interface DexCoinOverviewProps extends HTMLProps<HTMLDivElement> {
    chainId: number;
    address: string;
}

export const DexCoinOverview = memo<DexCoinOverviewProps>(function DexCoinOverview({
    chainId,
    address,
    className,
    ...rest
}) {
    const { data: detail, isLoading } = useQuery({
        queryKey: ['dex-coin-detail', chainId, address.toLowerCase()],
        queryFn: () => getDexCoinDetail(chainId, address),
    });

    if (!detail) {
        return (
            <div {...rest} className={classNames('flex justify-center', className)}>
                {isLoading ? <Loading /> : null}
            </div>
        );
    }

    const marketCap = detail.market_data.market_cap_usd;
    const liquidity = detail.liquidity;
    const fdv = detail.market_data.fdv_usd;
    const tradeVol24h = detail.market_data.volume_usd_24h;
    const holders = detail.holders;
    const createAt = detail.pool_created_at;
    const links = detail.links;
    const communityUrls: ClubUrl[] = links
        ? ([
              {
                  type: 'twitter',
                  link: links.twitter_handle ? `https://x.com/${links.twitter_handle}` : null,
              },
              {
                  type: 'discord',
                  link: links.discord_url,
              },
              {
                  type: 'telegram',
                  link: links.telegram_handle ? `https://t.me/${links.telegram_handle}` : null,
              },
          ].filter((x) => x.link) as ClubUrl[])
        : EMPTY_LIST;

    return (
        <div {...rest} className={classNames('space-y-3', className)}>
            <h2 className="font-inter text-main font-bold">
                <Trans>Statistic</Trans>
            </h2>
            <div className="grid grid-cols-3 gap-3">
                <InfoCard
                    title={<Trans>Market Cap</Trans>}
                    value={marketCap ? formatMarketCap(marketCap, 2, '$') : fdv ? formatMarketCap(fdv, 2, '$') : '-'}
                    description={
                        marketCap === null ? (
                            <Trans>Assuming circulating supply = total supply (includes locked, excludes burned)</Trans>
                        ) : (
                            <Trans>
                                Market Cap is sourced from CoinGecko and includes token issued on other blockchain.
                            </Trans>
                        )
                    }
                />
                <InfoCard
                    title={<Trans>Liquidity</Trans>}
                    value={liquidity ? formatMarketCap(liquidity, 2, '$') : '-'}
                />
                <InfoCard title={<Trans>FDV</Trans>} value={fdv ? formatMarketCap(fdv, 2, '$') : '-'} />
                <InfoCard
                    title={<Trans>24h Vol</Trans>}
                    value={tradeVol24h ? formatMarketCap(tradeVol24h, 2, '$') : '-'}
                />
                <InfoCard
                    title={<Trans>Holders</Trans>}
                    value={holders ? formatMarketCap(holders, 2) : '-'}
                    description={
                        <>
                            <Trans>
                                In some cases, you can also find a more detailed breakdown of holders in the explorer
                                page.
                            </Trans>
                            <OriginalLink target="_blank" href={resolveAddressLink(chainId, address) || ''}>
                                <LinkIcon width={14} height={14} className="text-second inline-block" />
                            </OriginalLink>
                        </>
                    }
                />
                <InfoCard
                    title={<Trans>Age</Trans>}
                    value={createAt ? formatAge(createAt) : '-'}
                    description={createAt ? formatDate(new Date(createAt), 'MMM d, yyyy, hh:mm a') : null}
                />
            </div>
            <h2 className="font-inter text-main font-bold">
                <Trans>Info</Trans>
            </h2>
            <div className="flex flex-col gap-3">
                <InfoRow
                    title={<Trans>Contract Address</Trans>}
                    extra={
                        <div className="flex items-center gap-1">
                            <ChainIcon chainId={chainId} className="shrink-0" width={16} height={16} />
                            <Tooltip
                                content={
                                    <div className="max-w-[200px] whitespace-normal text-wrap break-words text-center">
                                        {address}
                                    </div>
                                }
                                placement="top"
                                touch
                            >
                                <span className="text-medium text-main truncate font-bold" data-address={address}>
                                    {formatAddress(address, 4)}
                                </span>
                            </Tooltip>
                            <CopyTextButton notification="toast" text={address} />
                        </div>
                    }
                />
                {detail.links.homepage.length ? (
                    <InfoRow
                        title={<Trans>Website</Trans>}
                        className="!items-start"
                        extra={
                            <div className="flex flex-col justify-end gap-1">
                                {detail.links.homepage.map((url) => (
                                    <Link
                                        key={url}
                                        href={url}
                                        target="_blank"
                                        className="text-right text-[#8E96FF] hover:underline"
                                    >
                                        {parseUrl(url)?.host || url}
                                    </Link>
                                ))}
                            </div>
                        }
                    />
                ) : null}
                {communityUrls.length ? (
                    <InfoRow
                        title={<Trans>Community</Trans>}
                        extra={
                            <div className="flex gap-2">
                                {communityUrls.map((x) => (
                                    <ClubLink key={x.link} link={x} />
                                ))}
                            </div>
                        }
                    />
                ) : null}
            </div>
        </div>
    );
});
