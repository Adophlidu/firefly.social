'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { parseUrl } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { first, sortBy } from 'lodash-es';
import { type HTMLProps, memo, useMemo } from 'react';

import { useUpdateContractParams } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/useUpdateContractParams.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { Loading } from '@/components/Loading.js';
import { ClubLink } from '@/components/TokenProfile/CommunityLink.js';
import { ContractList } from '@/components/TokenProfile/ContractList.js';
import { DexCoinOverview } from '@/components/TokenProfile/TokenOverview/DexCoinOverview.js';
import { InfoCard } from '@/components/TokenProfile/TokenOverview/InfoCard.js';
import { InfoRow } from '@/components/TokenProfile/TokenOverview/InfoRow.js';
import { Tooltip } from '@/components/Tooltip.js';
import { formatAddress, formatTokenAddressSui } from '@/helpers/formatAddress.js';
import { formatMarketCap } from '@/helpers/formatMarketCap.js';
import { getChainInfo } from '@/helpers/getChainInfo.js';
import { isValidAddress, isValidTokenAddressSui } from '@/helpers/isValidAddress.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useDetectToken } from '@/hooks/useDetectToken.js';
import { type Contract } from '@/providers/types/Trending.js';

export interface TokenOverviewProps extends HTMLProps<HTMLDivElement> {
    coinId: string | null | undefined;
    chainId?: number;
    address?: string;
    loading?: boolean;
}
export const TokenOverview = memo<TokenOverviewProps>(function TokenOverview({
    coinId,
    chainId,
    address,
    loading,
    ...rest
}) {
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

    if (isLoading || loading) return <Loading minHeight={387} />;
    if (!coinId && chainId && address) {
        return <DexCoinOverview chainId={chainId} address={address} {...rest} />;
    }

    const marketCap = market?.market_cap ?? (attributes?.market_cap_usd ? +attributes.market_cap_usd : undefined);
    const fdv = market?.fully_diluted_valuation ?? (attributes?.fdv_usd ? +attributes.fdv_usd : undefined);

    return (
        <div {...rest}>
            <div className="space-y-3">
                <h2 className="font-inter text-main font-bold">
                    <Trans>Statistic</Trans>
                </h2>

                <div className="flex gap-3">
                    <InfoCard
                        title={<Trans>Market Cap</Trans>}
                        value={marketCap ? formatMarketCap(marketCap, 2, '$') : undefined}
                        description={
                            <Trans>
                                <div>Market Cap = Current Price x Circulating Supply</div>
                                <div className="mt-2">
                                    Refers to the total market value of a cryptocurrency’s circulating supply. It is
                                    similar to the stock market’s measurement of multiplying price per share by shares
                                    readily available in the market (not held & locked by insiders, governments)
                                </div>
                            </Trans>
                        }
                    />
                    <InfoCard
                        title={<Trans>FDV</Trans>}
                        value={fdv ? formatMarketCap(fdv, 2, '$') : undefined}
                        description={
                            <Trans>
                                <div>Fully Diluted Valuation (FDV) = Current Price x Total Supply</div>
                                <div className="mt-2">
                                    Fully Diluted Valuation (FDV) is the theoretical market capitalization of a coin if
                                    the entirety of its supply is in circulation, based on its current market price. The
                                    FDV value is theoretical as increasing the circulating supply of a coin may impact
                                    its market price. Also depending on the tokenomics, emission schedule or lock-up
                                    period of a coin&apos;s supply, it may take a significant time before its entire
                                    supply is released into circulation.
                                </div>
                            </Trans>
                        }
                    />
                    <InfoCard
                        title={<Trans>24h Vol</Trans>}
                        value={market?.total_volume ? formatMarketCap(market.total_volume, 2, '$') : undefined}
                        description={
                            <Trans>
                                A measure of a cryptocurrency trading volume across all tracked platforms in the last 24
                                hours. This is tracked on a rolling 24-hour basis with no open/closing times.
                            </Trans>
                        }
                    />
                </div>
                <div className="flex gap-3">
                    <InfoCard
                        title={<Trans>Circulating Supply</Trans>}
                        value={market?.circulating_supply ? formatMarketCap(market.circulating_supply, 2) : undefined}
                        description={
                            <Trans>
                                The amount of coins that are circulating in the market and are tradeable by the public.
                                It is comparable to looking at shares readily available in the market (not held & locked
                                by insiders, governments).
                            </Trans>
                        }
                    />
                    {/* <InfoCard
                        title={<Trans>Total Treasury Holding</Trans>}
                        value={''}
                        description={
                            <Trans>Total amount of BTC held in treasuries by public companies and governments.</Trans>
                        }
                    /> */}
                </div>
                <div className="flex gap-3">
                    <InfoCard
                        title={<Trans>Total Supply</Trans>}
                        value={total_supply ? formatMarketCap(total_supply, 2) : '∞'}
                        description={
                            <Trans>
                                <div>
                                    The amount of coins that have already been created, minus any coins that have been
                                    burned (removed from circulation). It is comparable to outstanding shares in the
                                    stock market.
                                </div>
                                <div className="mt-2">Total Supply = Onchain supply - burned tokens</div>
                            </Trans>
                        }
                    />
                    <InfoCard
                        title={<Trans>Max Supply</Trans>}
                        value={market?.max_supply ? formatMarketCap(market.max_supply, 2) : '∞'}
                        description={
                            <Trans>
                                <div>
                                    The maximum number of coins coded to exist in the lifetime of the cryptocurrency. It
                                    is comparable to the maximum number of issuable shares in the stock market.
                                </div>
                                <div className="mt-2">Max Supply = Theoretical maximum as coded</div>
                            </Trans>
                        }
                    />
                </div>
            </div>
            <h2 className="font-inter text-main mt-3 font-bold">
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
                                        className="text-medium text-main truncate font-bold"
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
                                        className="text-highlight text-right hover:underline"
                                    >
                                        {parseUrl(url)?.host || url}
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
