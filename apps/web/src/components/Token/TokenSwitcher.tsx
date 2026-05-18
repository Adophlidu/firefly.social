'use client';

import LineArrowUp from '@dimensiondev/assets/line-arrow-up.svg';
import PriceArrow from '@dimensiondev/assets/price-arrow.svg';
import { TokenPlatformType } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { isNumber } from 'lodash-es';
import { type HTMLProps, memo, useState } from 'react';

import { TokenIcon } from '@/components/TokenIcon.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import type { SearchTokenInfo } from '@/providers/types/Firefly.js';

interface Props extends Omit<HTMLProps<HTMLDivElement>, 'onSelect'> {
    tokenInfos: SearchTokenInfo[];
    platformType: TokenPlatformType;
    onClose: () => void;
    onSelect: (tokenInfo: SearchTokenInfo) => void;
}

export const TokenSwitcher = memo<Props>(function TokenSwitcher({
    platformType,
    tokenInfos,
    onClose,
    onSelect,
    ...rest
}) {
    const allTabs = [
        {
            label: <Trans>Coins</Trans>,
            platformType: TokenPlatformType.Cex,
        },
        {
            label: <Trans>Dex</Trans>,
            platformType: TokenPlatformType.Dex,
        },
    ];
    // Only show tabs that have tokens
    const tabs = allTabs.filter((tab) => tokenInfos.some((tokenInfo) => tokenInfo.platform_type === tab.platformType));
    const [platform = platformType, setPlatform] = useState<TokenPlatformType>(
        () => tabs.find((tab) => tab.platformType === platformType)?.platformType ?? tabs[0]?.platformType,
    );

    const filteredTokens = platform
        ? tokenInfos.filter((tokenInfo) => tokenInfo.platform_type === platform)
        : tokenInfos;

    return (
        <div
            {...rest}
            className={classNames(
                'border-line bg-primaryBottom flex cursor-default flex-col gap-2 rounded-2xl border px-3 py-[7px]',
                rest.className,
            )}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <div className="text-main grid grid-cols-[20px_auto_20px] grid-rows-1" onClick={onClose}>
                <div className="text-main col-start-2 text-center text-sm font-bold leading-[18px]">
                    <Trans>View similar symbols</Trans>
                </div>
                <LineArrowUp className="cursor-pointer" width={20} height={20} />
            </div>
            <div className="flex gap-2">
                {tabs.map((tab) => {
                    return (
                        <span
                            key={tab.platformType}
                            className={classNames(
                                'flex h-6 cursor-pointer list-none justify-center rounded-md px-1.5 text-xs leading-6 lg:flex-initial lg:justify-start',
                                platform === tab.platformType
                                    ? 'bg-highlight text-white'
                                    : 'bg-thirdMain text-second hover:text-highlight',
                            )}
                            onClick={() => setPlatform(tab.platformType)}
                            aria-current={platform === tab.platformType ? 'page' : undefined}
                        >
                            {tab.label}
                        </span>
                    );
                })}
            </div>
            <div className="no-scrollbar flex max-h-[220px] flex-col gap-2 overflow-auto">
                {filteredTokens.map((tokenInfo) => {
                    const market_data = tokenInfo.market_data;
                    const isUp = market_data?.price_change_percentage_24h
                        ? market_data.price_change_percentage_24h > 0
                        : null;
                    return (
                        <div
                            key={tokenInfo.id || `${tokenInfo.chain_id}-${tokenInfo.contract_address}`}
                            className="flex cursor-pointer gap-2 p-2"
                            onClick={() => {
                                onSelect(tokenInfo);
                                onClose();
                            }}
                        >
                            <TokenIcon
                                className="shrink-0"
                                icon={tokenInfo.image.large}
                                chainId={tokenInfo.chain_id}
                                disableBadge={tokenInfo.platform_type === TokenPlatformType.Cex}
                                name={tokenInfo.name}
                                alt={tokenInfo.name}
                                size={32}
                            />
                            <div className="flex flex-col">
                                <div className="text-main text-base font-bold leading-4">{tokenInfo.name}</div>
                                <div className="text-secondary text-[13px] font-bold uppercase leading-4">
                                    {tokenInfo.symbol}
                                </div>
                            </div>
                            <div className="ml-auto flex flex-col items-end">
                                <div className="text-main text-base font-bold leading-4">
                                    ${renderShrankPrice(formatPrice(market_data?.token_price_usd) ?? '-')}
                                </div>
                                {isNumber(market_data?.price_change_percentage_24h) ? (
                                    <div className="text-secondary flex items-center text-[13px] font-bold uppercase leading-4">
                                        <PriceArrow
                                            width={16}
                                            height={16}
                                            className={isUp ? 'text-success shrink-0' : 'text-fail shrink-0 rotate-180'}
                                        />
                                        <span className={isUp ? 'text-success' : 'text-fail'}>
                                            {market_data.price_change_percentage_24h.toFixed(2)}%
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-secondary flex items-center text-[13px] font-bold uppercase leading-4">
                                        <span>-</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
