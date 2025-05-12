import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo, useState } from 'react';

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
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useCoinPrice24hStats } from '@/hooks/useCoinPriceStats.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import { useTokenSecurity } from '@/hooks/useTokenSecurity.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { SearchTokenInfo } from '@/providers/types/Firefly.js';

interface Props extends HTMLProps<HTMLDivElement> {
    symbol: string;
    onTokenSelect?: (tokenInfo: SearchTokenInfo) => void;
}

export const TokenProfile = memo<Props>(function TokenProfile({ symbol, children, onTokenSelect, ...rest }) {
    const [openSwitcher, setOpenSwitcher] = useState(false);
    const { data: tokenInfos = EMPTY_LIST } = useQuery({
        queryKey: ['search-token', symbol],
        queryFn: () => FireflyEndpointProvider.searchTokenInfos(symbol),
    });
    const [selectedToken = tokenInfos[0], setSelectedToken] = useState<SearchTokenInfo>();
    const address = selectedToken?.contract_address;
    const { data: detected } = useQuery({
        queryKey: ['detect-address', address],
        queryFn: () => FireflyEndpointProvider.detectAddress(address),
        select: (data) => {
            const tokens = data.list.filter((x) => {
                if (x.contract_info.attributes.symbol.toLowerCase() !== symbol.toLowerCase()) return false;
                return (
                    (x.type === 'eth' && x.contract_type === 'ERC20') ||
                    (x.type === 'solana' && x.contract_type === 'token')
                );
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

    const { priceStats, isPending, isUp } = useCoinPrice24hStats(coingeckoCoinId || token?.id);

    const chainId = detected?.chain_id ? +detected.chain_id : tradeInfo.chainId;

    const { data: tokenSecurity } = useTokenSecurity(chainId, address);

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
                    onTokenSelect?.(tokenInfo);
                    setSelectedToken(tokenInfo);
                }}
            />
        );
    }

    return (
        <div
            {...rest}
            className={classNames(
                'flex cursor-default rounded-2xl border border-line bg-primaryBottom px-3 py-[7px]',
                rest.className,
            )}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-[14px] whitespace-nowrap text-second">
                    <Link href={tokenPageUrl}>
                        <TokenIcon
                            icon={selectedToken.image.large || `https://stamp.firefly.land/logo/${address}`}
                            chainId={chainId}
                            alt={selectedToken.name}
                            size={32}
                        />
                    </Link>
                    <div className="flex flex-col">
                        <Link
                            className="text-base font-bold uppercase leading-4 text-main hover:underline"
                            href={tokenPageUrl}
                        >
                            {selectedToken.symbol}
                        </Link>
                        <div className="flex items-center gap-1 leading-4">
                            {tokenSecurity ? <SecurityBadge security={tokenSecurity} interactive={false} /> : null}
                            <span className="max-w-28 truncate font-inter text-sm font-bold leading-4 text-third">
                                {formatAddress(address, 4)}
                            </span>
                            <CopyTextButton text={address} className="leading-4 [&_svg]:ml-0" />
                        </div>
                    </div>
                </div>
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
                <div className="line-height-[22px] flex items-center gap-1 text-medium">
                    {typeof market_data.price_change_percentage_24h === 'number' ? (
                        <Trans>
                            <PriceArrow
                                width={16}
                                height={16}
                                className={isUp ? 'shrink-0 text-success' : 'shrink-0 rotate-180 text-fail'}
                            />
                            <span className={isUp ? 'text-success' : 'text-fail'}>
                                {market_data.price_change_percentage_24h.toFixed(2)}%
                            </span>
                            <span className="text-medium text-secondary">today</span>
                            <strong className="font-bold">${renderShrankPrice(formatPrice(price) ?? '-')}</strong>
                        </Trans>
                    ) : (
                        <span>-</span>
                    )}
                </div>
            </div>
            <div className="ml-auto grid w-[170px] grid-cols-1 grid-rows-3">
                {tokenInfos.length > 1 ? (
                    <div
                        className="row-start-1 flex cursor-pointer items-center gap-1"
                        onClick={() => setOpenSwitcher(true)}
                    >
                        <div className="text-sm font-bold leading-[18px] text-main">
                            <Trans>View similar symbols</Trans>
                        </div>
                        <LineArrowUp className="rotate-180" width={20} height={20} />
                    </div>
                ) : null}
                <div
                    className={classNames(
                        'row-start-2 min-w-[50px] max-w-[170px] overflow-auto',
                        isPending ? 'animate-pulse' : null,
                    )}
                >
                    <SimplePriceChart records={priceStats} className="size-full" />
                </div>
                {address && detected?.chain_id ? (
                    <div className="row-start-3 flex items-center justify-end">
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
