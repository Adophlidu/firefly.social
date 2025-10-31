'use client';

import { classNames } from '@firefly/utils';
import type { HTMLProps } from 'react';

import { Image } from '@/components/Image.js';
import { NetworkPluginID, NetworkType } from '@/constants/enum.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { resolveCoinGeckoChainIcon } from '@/helpers/resolveCoinGeckoChainIcon.js';
import { resolveDebankChain } from '@/helpers/resolveDebankChain.js';

interface ChainIconProps extends HTMLProps<HTMLImageElement> {
    networkType?: NetworkType;
    chainId: number | undefined;
    coingeckoChain?: string;
    size?: number;
    allowEmpty?: boolean;
}

export function ChainIcon({ chainId, coingeckoChain, size = 22, className, networkType, allowEmpty }: ChainIconProps) {
    const networkDescriptor =
        isValidChainIdSolana(chainId) || networkType === NetworkType.Solana
            ? getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, chainId)
            : getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, chainId);
    const coingeckoChainIcon = coingeckoChain ? resolveCoinGeckoChainIcon(coingeckoChain) : undefined;
    const icon = networkDescriptor?.icon || coingeckoChainIcon || resolveDebankChain(chainId)?.logo_url;

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
