import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo, useMemo, useState } from 'react';

import LineArrowUp from '@/assets/line-arrow-up.svg';
import PriceArrow from '@/assets/price-arrow.svg';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { SecurityBadge } from '@/components/EmbedCards/TokenSecurityBadge.js';
import { Link } from '@/components/Link.js';
import { SimplePriceChart } from '@/components/PriceChart/SimplePriceChart.js';
import { TokenSwitcher } from '@/components/Token/TokenSwitcher.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { useTradeInfo } from '@/components/TokenProfile/useTradeInfo.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatMarketCap } from '@/helpers/formatMarketCap.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useCoinPrice24hStats } from '@/hooks/useCoinPriceStats.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useTokenCoin } from '@/hooks/useTokenCoin.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import { useTokenSecurity } from '@/hooks/useTokenSecurity.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function TokenProfileSkeleton(props: HTMLProps<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={classNames(
                'cursor-default rounded-2xl border border-line bg-primaryBottom p-3',
                props.className,
            )}
        >
            <div className="flex animate-pulse flex-col gap-3">
                <div className="flex items-center">
                    <div className="size-8 rounded-full bg-bg" />
                    <div className="ml-3 flex flex-col gap-1">
                        <div className="item-center flex gap-1">
                            <div className="h-3 w-10 rounded bg-bg py-0.5" />
                            <span className="size-3 rounded-full bg-bg" />
                        </div>
                        <div className="flex items-center gap-1 leading-4">
                            <span className="h-3 w-20 bg-bg py-0.5" />
                        </div>
                    </div>
                    <div className="ml-auto flex items-center justify-end gap-1 self-start">
                        <div className="h-[18px] w-[130px] rounded bg-bg text-main" />
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="line-height-[22px] flex items-center gap-1">
                        <strong className="h-[22px] w-20 rounded bg-bg" />
                        <span className="h-4 w-6 bg-bg text-medium text-secondary" title={t`Market Cap`} />
                        <span className="inline-flex h-[14px] w-12 items-center text-nowrap rounded bg-bg px-1 py-0.5" />
                    </div>
                    <div className="ml-auto h-8 w-[170px] overflow-auto rounded bg-bg" />
                </div>
                <div className="flex items-center">
                    <div className="line-height-[22px] flex h-8 items-center gap-1 text-medium">
                        <span className="h-3 w-10 rounded bg-bg py-0.5" />
                        <span className="h-3 w-20 rounded bg-bg py-0.5" />
                        <span className="h-3 w-10 rounded bg-bg py-0.5" />
                    </div>
                    <div className="row-start-3 ml-auto flex h-8 w-[80px] items-center justify-end rounded-full bg-bg" />
                </div>
            </div>
        </div>
    );
}

interface Props extends HTMLProps<HTMLDivElement> {
    symbol: string;
}

export const TokenProfile = memo<Props>(function TokenProfile({ symbol, children, ...rest }) {
    const [openSwitcher, setOpenSwitcher] = useState(false);
    const { data: tokenInfos = EMPTY_LIST, isLoading } = useQuery({
        queryKey: ['search-token', symbol],
        queryFn: () => FireflyEndpointProvider.searchTokenInfos(symbol),
    });
    const [coin, setCoin] = useTokenCoin(symbol);
    const selectedToken = useMemo(() => {
        if (!coin) return tokenInfos[0];

        const matched = tokenInfos.find(
            (x) =>
                x.id === coin.id && x.chain === coin.chain && isSameAddress(x.contract_address, coin.contract_address),
        );
        return matched || tokenInfos[0];
    }, [coin, tokenInfos]);

    const address = selectedToken?.contract_address;
    const { data: detected } = useQuery({
        queryKey: ['detect-address', address],
        queryFn: () => FireflyEndpointProvider.detectAddress(address),
        select: (data) => {
            if (!data) return;
            const tokens = data.list.filter((x) => {
                const isToken =
                    (x.type === 'eth' && x.contract_type === 'ERC20') ||
                    (x.type === 'solana' && x.contract_type === 'token');
                if (!isToken) return false;
                return x.contract_info.attributes.symbol.toLowerCase() === symbol.toLowerCase();
            });
            return tokens[0];
        },
    });
    const attributes = detected?.contract_info?.attributes;
    const coingeckoCoinId = selectedToken?.id || attributes?.coingecko_coin_id;
    const hasCoinId = !!coingeckoCoinId;

    const { data: token } = useTokenInfo(coingeckoCoinId || address, hasCoinId);
    const { data: trending } = useCoinTrending(token?.id);
    const tradeInfo = useTradeInfo(token);

    const chainId = detected?.chain_id ? +detected.chain_id : tradeInfo.chainId;
    const { priceStats, isPending, isUp } = useCoinPrice24hStats(coingeckoCoinId || token?.id, chainId, address);

    const { data: tokenSecurity } = useTokenSecurity(chainId, address);

    if (isLoading) return <TokenProfileSkeleton {...rest} />;

    if (!selectedToken) return null;
    const market_data = selectedToken.market_data;
    const price = market_data.token_price_usd;
    const market_cap = market_data.market_cap_usd;
    const tokenPageUrl = resolveTokenPageUrl({
        identity: coingeckoCoinId || selectedToken.symbol,
        chainId: selectedToken.chain_id,
        isCoinId: hasCoinId,
    });

    const rank = token?.rank || trending?.coin.market_cap_rank;

    if (openSwitcher) {
        return (
            <TokenSwitcher
                {...rest}
                platformType={selectedToken.platform_type}
                onClose={() => setOpenSwitcher(false)}
                tokenInfos={tokenInfos}
                onSelect={(tokenInfo) => {
                    setCoin(symbol, tokenInfo);
                }}
            />
        );
    }

    return (
        <div
            {...rest}
            className={classNames(
                'flex cursor-default flex-col gap-3 rounded-2xl border border-line bg-primaryBottom p-3',
                rest.className,
            )}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <div className="flex items-center">
                <Link href={tokenPageUrl}>
                    <TokenIcon
                        icon={selectedToken.image.large || `https://stamp.firefly.land/logo/${address}`}
                        chainId={chainId}
                        alt={selectedToken.name}
                        size={32}
                    />
                </Link>
                <div className="ml-3 flex flex-col">
                    <div className="flex items-center gap-1">
                        <Link
                            className="text-base font-bold uppercase leading-4 text-main hover:underline"
                            href={tokenPageUrl}
                        >
                            {selectedToken.symbol}
                        </Link>
                        {tokenSecurity ? <SecurityBadge security={tokenSecurity} interactive={false} /> : null}
                    </div>
                    <div className="flex items-center gap-1 leading-4">
                        <span className="max-w-28 truncate font-inter text-[13px] font-bold leading-4 text-third">
                            {formatAddress(address, 4)}
                        </span>
                        {address ? (
                            <CopyTextButton text={address} className="leading-4 text-third [&_svg]:ml-0" />
                        ) : null}
                    </div>
                </div>
                {tokenInfos.length > 1 ? (
                    <div
                        className="ml-auto flex cursor-pointer items-center gap-1 self-start"
                        onClick={() => setOpenSwitcher(true)}
                    >
                        <div className="text-sm font-bold leading-[18px] text-main">
                            <Trans>View similar symbols</Trans>
                        </div>
                        <LineArrowUp className="rotate-180" width={20} height={20} />
                    </div>
                ) : null}
            </div>
            <div className="flex items-center">
                <div className="line-height-[22px] flex items-center gap-1">
                    <Trans>
                        <strong className="text-2xl font-bold leading-[22px]">
                            {market_cap ? `$${formatMarketCap(market_cap)}` : '-'}
                        </strong>
                        <span className="text-medium text-secondary" title={t`Market Cap`}>
                            MC
                        </span>
                        {rank ? (
                            <span className="inline-flex h-[14px] items-center text-nowrap rounded bg-highlight px-1 py-0.5 text-[10px] text-white">
                                Rank #{rank}
                            </span>
                        ) : null}
                    </Trans>
                </div>
                <div
                    className={classNames(
                        'ml-auto h-10 min-w-[150px] max-w-[170px] shrink-0 flex-grow overflow-auto',
                        isPending ? 'animate-pulse' : null,
                    )}
                >
                    <SimplePriceChart records={priceStats} className="size-full" />
                </div>
            </div>
            <div className="flex items-center">
                <div className="line-height-[22px] flex h-8 items-center gap-1 text-medium">
                    {typeof market_data.price_change_percentage_24h === 'number' ? (
                        <Trans>
                            <PriceArrow
                                width={16}
                                height={16}
                                className={isUp ? 'shrink-0 text-success' : 'shrink-0 rotate-180 text-fail'}
                            />
                            <span className={isUp ? 'text-xs text-success' : 'text-xs text-fail'}>
                                {market_data.price_change_percentage_24h.toFixed(2)}%
                            </span>
                            <span className="text-medium text-secondary">today</span>
                            <strong className="text-medium font-bold">
                                ${renderShrankPrice(formatPrice(price) ?? '-')}
                            </strong>
                        </Trans>
                    ) : (
                        <span>-</span>
                    )}
                </div>
                {address && detected?.chain_id ? (
                    <div className="ml-auto flex items-center justify-end">
                        <SwapButton
                            tradable={tradeInfo.tradable ? detected?.type === 'eth' : false}
                            className="flex shrink-0 grow-0 flex-row-reverse !gap-1 !px-3 !py-2"
                            swapProps={{
                                chainId: +detected.chain_id,
                                chainIds: tradeInfo.supportedChainIds?.map((x) => x.toString()),
                                toToken: address,
                            }}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
});
