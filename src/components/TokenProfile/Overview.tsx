import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { first, isNumber, sortBy } from 'lodash-es';
import { type HTMLProps, memo, type ReactNode, useMemo } from 'react';

import { useUpdateContractParams } from '@/app/(normal)/token/[exchange]/[[...slug]]/useUpdateContractParams.js';
import LinkIcon from '@/assets/link-square.svg';
import QuestionIcon from '@/assets/question.svg';
import { ChainIcon } from '@/components/ChainIcon.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { Loading } from '@/components/Loading.js';
import NotFound from '@/components/NotFound.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { ClubLink } from '@/components/TokenProfile/CommunityLink.js';
import { ContractList } from '@/components/TokenProfile/ContractList.js';
import { Tooltip } from '@/components/Tooltip.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { Link as OriginalLink } from '@/esm/Link.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress, formatTokenAddressSui } from '@/helpers/formatAddress.js';
import { formatAge } from '@/helpers/formatAge.js';
import { formatMarketCap } from '@/helpers/formatMarketCap.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { formatDate } from '@/helpers/formatTimestamp.js';
import { getChainInfo } from '@/helpers/getChainInfo.js';
import { isValidAddress, isValidTokenAddressSui } from '@/helpers/isValidAddress.js';
import { resolveAddressLink } from '@/helpers/resolveExplorer.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useDetectToken } from '@/hooks/useDetectToken.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { ClubUrl, Contract } from '@/providers/types/Trending.js';

interface InfoRowProps extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
    title: ReactNode;
    description?: ReactNode;
    value?: string | number;
    amount?: string | number;
    asInfinite?: boolean;
    extra?: ReactNode;
}

function renderZero(value?: string) {
    return !value || value.replace('$', '') === '0' ? '-' : value;
}

function InfoRow({ title, description, amount, asInfinite, value, extra, className, ...rest }: InfoRowProps) {
    return (
        <div className={classNames('flex items-center gap-2 text-medium', className)} {...rest}>
            <span className="whitespace-nowrap text-second">{title}</span>
            {description ? (
                <Tooltip placement="top" content={description} touch>
                    <QuestionIcon className="ml-1 cursor-pointer text-second" width={14} height={14} />
                </Tooltip>
            ) : null}
            {extra ? (
                <div className="ml-auto min-w-0">{extra}</div>
            ) : (
                <div
                    className={classNames(
                        'ml-auto min-w-0 truncate whitespace-nowrap font-inter font-bold text-main',
                        asInfinite ? 'text-2xl leading-[22.5px]' : 'text-medium',
                    )}
                >
                    {asInfinite
                        ? '∞'
                        : isNumber(value)
                          ? renderZero(`$${formatPrice(+value)}`)
                          : renderZero(formatPrice(amount) ?? '-')}
                </div>
            )}
        </div>
    );
}

function getHost(url: string) {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}

export interface TokenOverviewProps extends HTMLProps<HTMLDivElement> {
    coinId: string | null | undefined;
    chainId?: number;
    address?: string;
}
export const Overview = memo<TokenOverviewProps>(function Overview({ coinId, chainId, address, ...rest }) {
    const { data: trending, isLoading } = useCoinTrending(coinId);
    const { market, coin } = trending ?? {};
    const { data: detected } = useDetectToken(address, !trending);
    const attributes = detected?.contract_info?.attributes;
    const updateContractParams = useUpdateContractParams();

    const contracts = useMemo(() => {
        if (trending?.contracts) {
            return sortBy(trending.contracts, (x) => (isValidAddress(x.address) ? 0 : 1));
        }
        if (detected?.contract_info) {
            return [
                {
                    runtime: detected.chain,
                    chainId: +detected.chain_id,
                    address: detected.contract_info.attributes.address,
                } as Contract,
            ];
        }
        return EMPTY_LIST;
    }, [detected, trending?.contracts]);
    const contract = contracts.find((x) => x.chainId === chainId || x.chainId === chainId) || first(contracts);
    const chain = getChainInfo(contract?.runtime, contract?.chainId);

    const total_supply = market?.total_supply ?? attributes?.normalized_total_supply;

    const selectedAddress = useMemo(() => {
        const selected = address || contracts[0]?.address;
        if (isValidTokenAddressSui(selected)) return formatTokenAddressSui(selected);
        return selected;
    }, [address, contracts]);

    if (!coinId && !isLoading && chainId && address) {
        return <DexCoinOverview chainId={chainId} address={address} {...rest} />;
    }

    return (
        <div {...rest}>
            <h2 className="font-inter font-bold text-main">
                <Trans>Statistic</Trans>
            </h2>
            <div className="mt-3 flex flex-col gap-3">
                <InfoRow
                    title={<Trans>Market Cap</Trans>}
                    description={
                        <Trans>
                            <div>Market Cap = Current Price x Circulating Supply</div>
                            <div className="mt-2">
                                Refers to the total market value of a cryptocurrency’s circulating supply. It is similar
                                to the stock market’s measurement of multiplying price per share by shares readily
                                available in the market (not held & locked by insiders, governments)
                            </div>
                        </Trans>
                    }
                    value={market?.market_cap ?? (attributes?.market_cap_usd ? +attributes.market_cap_usd : undefined)}
                />
                <InfoRow
                    title={<Trans>Fully Diluted Valuation</Trans>}
                    description={
                        <Trans>
                            <div>Fully Diluted Valuation (FDV) = Current Price x Total Supply</div>
                            <div className="mt-2">
                                Fully Diluted Valuation (FDV) is the theoretical market capitalization of a coin if the
                                entirety of its supply is in circulation, based on its current market price. The FDV
                                value is theoretical as increasing the circulating supply of a coin may impact its
                                market price. Also depending on the tokenomics, emission schedule or lock-up period of a
                                coin&apos;s supply, it may take a significant time before its entire supply is released
                                into circulation.
                            </div>
                        </Trans>
                    }
                    value={market?.fully_diluted_valuation ?? (attributes?.fdv_usd ? +attributes.fdv_usd : undefined)}
                />
                <InfoRow
                    title={<Trans>Market Cap / FDV</Trans>}
                    description={
                        <Trans>
                            <div>
                                The proportion of current market capitalization compares to market capitalization when
                                meeting max supply.
                            </div>
                            <div className="mt-2">
                                The closer the Mkt Cap/FDV to 1, the closer the current market capitalization to its
                                fully diluted valuation and vice versa.
                            </div>
                        </Trans>
                    }
                    amount={market?.market_cap_fdv_ratio}
                />
                <InfoRow
                    title={<Trans>24 Hour Trading Vol</Trans>}
                    description={
                        <Trans>
                            A measure of a cryptocurrency trading volume across all tracked platforms in the last 24
                            hours. This is tracked on a rolling 24-hour basis with no open/closing times.
                        </Trans>
                    }
                    value={market?.total_volume}
                />
                <InfoRow
                    title={<Trans>Circulating Supply</Trans>}
                    description={
                        <Trans>
                            The amount of coins that are circulating in the market and are tradeable by the public. It
                            is comparable to looking at shares readily available in the market (not held & locked by
                            insiders, governments).
                        </Trans>
                    }
                    amount={market?.circulating_supply}
                />
                <InfoRow
                    title={<Trans>Total Supply</Trans>}
                    description={
                        <Trans>
                            <div>
                                The amount of coins that have already been created, minus any coins that have been
                                burned (removed from circulation). It is comparable to outstanding shares in the stock
                                market.
                            </div>
                            <div className="mt-2">Total Supply = Onchain supply - burned tokens</div>
                        </Trans>
                    }
                    amount={total_supply}
                    asInfinite={!total_supply}
                />
                <InfoRow
                    title={<Trans>Max Supply</Trans>}
                    description={
                        <Trans>
                            <div>
                                The maximum number of coins coded to exist in the lifetime of the cryptocurrency. It is
                                comparable to the maximum number of issuable shares in the stock market.
                            </div>
                            <div className="mt-2">Max Supply = Theoretical maximum as coded</div>
                        </Trans>
                    }
                    amount={market?.max_supply}
                    asInfinite={!market?.max_supply}
                />
            </div>
            <h2 className="mt-3 font-inter font-bold text-main">
                <Trans>Info</Trans>
            </h2>
            <div className="mt-3 flex flex-col gap-3">
                {contracts.length ? (
                    <InfoRow
                        title={<Trans>Contract Address</Trans>}
                        extra={
                            <div className="flex items-center gap-1">
                                {chain ? (
                                    <Image
                                        src={chain.icon}
                                        className="shrink-0"
                                        alt={chain.name}
                                        width={16}
                                        height={16}
                                    />
                                ) : null}
                                <Tooltip
                                    content={
                                        <div className="max-w-[200px] whitespace-normal text-wrap break-words text-center">
                                            {selectedAddress}
                                        </div>
                                    }
                                    placement="top"
                                    touch
                                >
                                    <span
                                        className="truncate text-medium font-bold text-main"
                                        data-address={selectedAddress}
                                    >
                                        {formatAddress(selectedAddress, 4)}
                                    </span>
                                </Tooltip>
                                <CopyTextButton notification="toast" text={selectedAddress} />
                                {contracts.length > 1 ? (
                                    <ContractList contracts={contracts} onSelect={updateContractParams} />
                                ) : null}
                            </div>
                        }
                    />
                ) : null}
                {coin?.home_urls?.length ? (
                    <InfoRow
                        title={<Trans>Website</Trans>}
                        className="!items-start"
                        extra={
                            <div className="flex flex-col justify-end gap-1">
                                {coin.home_urls.map((url) => (
                                    <Link
                                        key={url}
                                        href={url}
                                        target="_blank"
                                        className="text-right text-highlight hover:underline"
                                    >
                                        {getHost(url)}
                                    </Link>
                                ))}
                            </div>
                        }
                    />
                ) : null}
                {coin?.community_urls?.length ? (
                    <InfoRow
                        title={<Trans>Community</Trans>}
                        extra={
                            <div className="flex gap-2">
                                {coin.community_urls.map((x) => (
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

interface DexCoinOverviewProps extends HTMLProps<HTMLDivElement> {
    chainId: number;
    address: string;
}
export const DexCoinOverview = memo<DexCoinOverviewProps>(function DexCoinOverview({ chainId, address, ...rest }) {
    const { data: detail, isLoading } = useQuery({
        queryKey: ['dex-coin-detail', chainId, address],
        queryFn: () => FireflyEndpointProvider.getDexCoinDetail(chainId, address),
    });

    if (!detail) {
        return (
            <div {...rest} className={classNames('flex justify-center', rest.className)}>
                {isLoading ? <Loading /> : <NotFound text={<Trans>Token could not be found.</Trans>} />}
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
        : [];

    return (
        <div {...rest}>
            <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 rounded-xl bg-lightBg p-4">
                    <p className="font-inter text-base font-bold leading-6 text-main">
                        {marketCap ? formatMarketCap(marketCap, 2, '$') : fdv ? formatMarketCap(fdv, 2, '$') : '-'}
                    </p>
                    <h3 className="font-inter text-[13px] leading-[18px] text-second underline">
                        <Tooltip
                            placement="top"
                            content={
                                <div className="w-[260px]">
                                    {marketCap === null ? (
                                        <Trans>
                                            Assuming circulating supply = total supply (includes locked, excludes
                                            burned)
                                        </Trans>
                                    ) : (
                                        <Trans>
                                            Market Cap is sourced from CoinGecko and includes token issued on other
                                            blockchain.
                                        </Trans>
                                    )}
                                </div>
                            }
                        >
                            <span className="truncate">
                                <Trans>Market Cap</Trans>
                            </span>
                        </Tooltip>
                    </h3>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-lightBg p-4">
                    <p className="font-inter text-base font-bold leading-6 text-main">
                        {liquidity ? formatMarketCap(liquidity, 2, '$') : '-'}
                    </p>
                    <h3 className="truncate font-inter text-[13px] leading-[18px] text-second">
                        <Trans>Liquidity</Trans>
                    </h3>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-lightBg p-4">
                    <p className="font-inter text-base font-bold leading-6 text-main">
                        {fdv ? formatMarketCap(fdv, 2, '$') : '-'}
                    </p>
                    <h3 className="truncate font-inter text-[13px] leading-[18px] text-second">
                        <Trans>FDV</Trans>
                    </h3>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-lightBg p-4">
                    <p className="font-inter text-base font-bold leading-6 text-main">
                        {tradeVol24h ? formatMarketCap(tradeVol24h, 2, '$') : '-'}
                    </p>
                    <TextOverflowTooltip content={<Trans>24h Vol</Trans>}>
                        <h3 className="truncate font-inter text-[13px] leading-[18px] text-second">
                            <Trans>24h Vol</Trans>
                        </h3>
                    </TextOverflowTooltip>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-lightBg p-4">
                    <p className="font-inter text-base font-bold leading-6 text-main">
                        {holders ? formatMarketCap(holders, 2) : '-'}
                    </p>
                    <h3 className="font-inter text-[13px] leading-[18px] text-second underline">
                        <Tooltip
                            interactive
                            content={
                                <div className="w-[260px]">
                                    <Trans>
                                        In some cases, you can also find a more detailed breakdown of holders in the
                                        explorer page.
                                    </Trans>
                                    <OriginalLink target="_blank" href={resolveAddressLink(chainId, address) || ''}>
                                        <LinkIcon width={14} height={14} className="inline-block text-second" />
                                    </OriginalLink>
                                </div>
                            }
                            placement="top"
                        >
                            <span className="truncate">
                                <Trans>Holders</Trans>
                            </span>
                        </Tooltip>
                    </h3>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-lightBg p-4">
                    <p className="font-inter text-base font-bold leading-6 text-main">
                        {createAt ? formatAge(createAt) : '-'}
                    </p>
                    <h3 className="inline-block font-inter text-[13px] leading-[18px] text-second underline">
                        <Tooltip
                            content={createAt ? formatDate(new Date(createAt), 'MMM d, yyyy, hh:mm a') : null}
                            placement="top"
                        >
                            <span>
                                <Trans>Age</Trans>
                            </span>
                        </Tooltip>
                    </h3>
                </div>
            </div>
            <div className="mt-3 flex flex-col gap-3">
                <InfoRow
                    title={<Trans>Ca</Trans>}
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
                                <span className="truncate text-medium font-bold text-main" data-address={address}>
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
                                        {getHost(url)}
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
