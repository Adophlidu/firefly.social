import { Trans } from '@lingui/react/macro';
import { first, isNumber } from 'lodash-es';
import { type HTMLProps, memo, type ReactNode, useMemo } from 'react';

import QuestionIcon from '@/assets/question.svg';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { CommunityLink } from '@/components/TokenProfile/CommunityLink.js';
import { ContractList } from '@/components/TokenProfile/ContractList.js';
import { Tooltip } from '@/components/Tooltip.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getChainInfo } from '@/helpers/getChainInfo.js';
import { resolveCoinGeckoChainId } from '@/helpers/resolveCoinGeckoChainId.js';
import { useDetectToken } from '@/hooks/useDetectToken.js';
import type { Contract, Trending } from '@/providers/types/Trending.js';

interface InfoRowProps {
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

function InfoRow({ title, description, amount, asInfinite, value, extra }: InfoRowProps) {
    return (
        <div className="flex items-center text-medium">
            <span className="text-second">{title}</span>
            {description ? (
                <Tooltip placement="top" content={description} touch>
                    <QuestionIcon className="ml-1 cursor-pointer text-second" width={14} height={14} />
                </Tooltip>
            ) : null}
            {extra ? (
                <div className="ml-auto">{extra}</div>
            ) : (
                <div
                    className={classNames(
                        'ml-auto font-inter font-bold text-main',
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
function formatContractAddress(contract: Contract) {
    if (contract.runtime === 'ethereum') formatAddressEthereum(contract.address, 4);
    return `${contract.address.slice(0, 6)}...${contract.address.slice(-4)}`;
}

interface TokenOverviewProps extends HTMLProps<HTMLDivElement> {
    trending: Trending | undefined;
    chainId?: number;
    address?: string;
}
export const TokenOverview = memo<TokenOverviewProps>(function TokenOverview({ trending, chainId, address, ...rest }) {
    const { market, coin } = trending ?? {};
    const { data: detected } = useDetectToken(address, !trending);
    const attributes = detected?.contract_info?.attributes;

    const contracts = useMemo(() => {
        if (trending?.contracts) {
            return trending.contracts;
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
    const contract =
        contracts.find((x) => x.chainId === chainId || resolveCoinGeckoChainId(x.runtime) === chainId) ||
        first(contracts);
    const chain = getChainInfo(contract?.runtime, contract?.chainId);

    const total_supply = market?.total_supply ?? attributes?.normalized_total_supply;
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
                {contracts?.length ? (
                    <InfoRow
                        title={<Trans>Contract Address</Trans>}
                        extra={
                            <div className="flex items-center gap-1">
                                {chain ? (
                                    <Image
                                        src={chain.icon}
                                        className="flex-shrink-0"
                                        alt={chain.name}
                                        width={16}
                                        height={16}
                                    />
                                ) : null}
                                <Tooltip
                                    content={
                                        <div className="max-w-[200px] whitespace-normal text-wrap break-words text-center">
                                            {contracts[0].address}
                                        </div>
                                    }
                                    placement="top"
                                    touch
                                >
                                    <span className="overflow-hidden text-ellipsis text-medium font-bold text-main">
                                        {formatContractAddress(contracts[0])}
                                    </span>
                                </Tooltip>
                                <CopyTextButton notification="toast" text={contracts[0].address} />
                                {contracts.length > 1 ? <ContractList contracts={contracts} /> : null}
                            </div>
                        }
                    />
                ) : null}
                {coin?.home_urls?.length ? (
                    <InfoRow
                        title={<Trans>Website</Trans>}
                        extra={
                            <div className="flex gap-1">
                                {coin.home_urls.map((url) => (
                                    <Link
                                        key={url}
                                        href={url}
                                        target="_blank"
                                        className="text-highlight hover:underline"
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
                                    <CommunityLink key={x.link} link={x} />
                                ))}
                            </div>
                        }
                    />
                ) : null}
            </div>
        </div>
    );
});
