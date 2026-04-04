import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type BigNumber } from 'bignumber.js';
import { type HTMLProps, memo, type ReactNode } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { chains } from '@/configs/chains.js';
import { STALE_TIMES } from '@/constants/query.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isZero, leftShift, multipliedBy, plus } from '@/helpers/number.js';
import { getFungibleTokenPrice } from '@/providers/coingecko/getFungibleTokenPrice.js';
import { type MintMetadata } from '@/providers/types/Firefly.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';

interface MintParamsPanelProps extends HTMLProps<HTMLUListElement> {
    mintParams: MintMetadata;
    mintCount: number;
    gasFee: BigNumber.Value;
    isLoading?: boolean;
    priceLabel?: ReactNode;
}

function renderPrice(price: BigNumber.Value, decimals = 18, symbol?: string) {
    return (
        <>
            {renderShrankPrice(formatPrice(leftShift(price, decimals).toString()) || '-')}
            {` ${symbol}`}
        </>
    );
}

export const MintParamsPanel = memo<MintParamsPanelProps>(function MintParamsPanel({
    mintParams,
    mintCount,
    gasFee,
    isLoading = false,
    priceLabel,
    className,
}) {
    const { chainId, platformFee, gasStatus, mintPrice } = mintParams;
    const chain = chains.find((chain) => chain.id === chainId);
    const { decimals, symbol } = chain?.nativeCurrency || {};
    const isFree = gasStatus === true;

    const totalCost = plus(multipliedBy(mintPrice || '0', mintCount), platformFee || '0').plus(gasFee);

    const { data: totalCostInUsd } = useQuery({
        queryKey: ['token-cost', chainId, totalCost.toString()],
        staleTime: STALE_TIMES.MINUTE_1,
        queryFn: async () => {
            try {
                const nativeToken = EVMChainResolver.nativeCurrency(chainId);
                if (!nativeToken) return;

                const usdPrice = await getFungibleTokenPrice(chainId, nativeToken.address);
                return formatPrice(multipliedBy(usdPrice || 0, leftShift(totalCost, nativeToken.decimals)).toString());
            } catch {
                return;
            }
        },
    });

    return (
        <ul className={classNames('text-main flex w-full flex-col gap-3 text-base', className)}>
            {chain ? (
                <li className="flex w-full items-center justify-between">
                    <span>
                        <Trans>Chain</Trans>
                    </span>
                    <span className="flex items-center gap-2">
                        <ChainIcon size={16} chainId={chainId} />
                        <span className="text-sm">{chain.name}</span>
                    </span>
                </li>
            ) : null}
            <li className="flex w-full items-center justify-between">
                <span>{priceLabel || <Trans>Mint price</Trans>}</span>
                <span className="text-secondary">
                    {isFree || isZero(mintPrice) ? <Trans>FREE</Trans> : renderPrice(mintPrice, decimals, symbol)}
                </span>
            </li>
            <li className="flex w-full items-center justify-between">
                <span>
                    <Trans>Platform fee</Trans>
                </span>
                <span className="text-secondary">{renderPrice(platformFee || '0', decimals, symbol)}</span>
            </li>
            <li className="flex w-full items-center justify-between">
                <span>
                    <Trans>Network cost</Trans>
                </span>
                <span className={classNames('text-secondary', isLoading ? 'bg-third h-6 w-24 animate-pulse' : '')}>
                    {isLoading ? '' : renderPrice(gasFee, decimals, symbol)}
                </span>
            </li>
            <li className="flex w-full items-center justify-between">
                <span>
                    <Trans>Total</Trans>
                </span>
                <span className="flex items-center gap-3">
                    <span
                        className={classNames('text-secondary', {
                            'line-through': isFree,
                            'bg-third h-6 w-24 animate-pulse': isLoading,
                        })}
                    >
                        {isLoading ? '' : renderPrice(totalCost, decimals, symbol)}
                        {totalCostInUsd && !isLoading ? `($${totalCostInUsd})` : ''}
                    </span>
                    {isFree ? (
                        <span className="rounded bg-[#E8E8FF] px-2 py-1 text-sm text-[#464D9D]">
                            <Trans>Free</Trans>
                        </span>
                    ) : null}
                </span>
            </li>
        </ul>
    );
});
