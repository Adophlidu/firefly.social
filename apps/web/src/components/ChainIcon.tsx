'use client';

import { classNames } from '@dimensiondev/utils';
import { getChainIcon, resolveDebankChain } from '@dimensiondev/web3/chains';
import type { NetworkType } from '@dimensiondev/web3/enums';
import type { HTMLProps } from 'react';

import { Image } from '@/components/Image.js';
import { resolveCoinGeckoChainIcon } from '@/helpers/resolveCoinGeckoChainIcon.js';

interface ChainIconProps extends HTMLProps<HTMLImageElement> {
    networkType?: NetworkType;
    chainId: number | undefined;
    coingeckoChain?: string;
    size?: number;
    allowEmpty?: boolean;
}

export function ChainIcon({ chainId, coingeckoChain, size = 22, className, allowEmpty }: ChainIconProps) {
    const coingeckoChainIcon = coingeckoChain ? resolveCoinGeckoChainIcon(coingeckoChain) : undefined;
    const icon = getChainIcon(chainId) || coingeckoChainIcon || resolveDebankChain(chainId)?.logo_url;

    if (!icon && allowEmpty) return null;

    return (
        <Image
            key={chainId}
            unoptimized
            src={icon ?? ''}
            width={size}
            height={size}
            style={{
                width: `${size}px`,
                height: `${size}px`,
            }}
            alt={`Blockchain: ${chainId}`}
            className={classNames(`rounded-full`, className)}
        />
    );
}
