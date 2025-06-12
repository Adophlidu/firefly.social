'use client';

import type { HTMLProps } from 'react';

import { Image } from '@/components/Image.js';
import { NetworkPluginID, NetworkType } from '@/constants/enum.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';

interface ChainIconProps extends HTMLProps<HTMLImageElement> {
    networkType?: NetworkType;
    chainId: number;
    size?: number;
    allowEmpty?: boolean;
}

export function ChainIcon({ chainId, size = 22, className, networkType, allowEmpty }: ChainIconProps) {
    const networkDescriptor =
        isValidChainIdSolana(chainId) || networkType === NetworkType.Solana
            ? getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, chainId)
            : getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, chainId);

    if (!networkDescriptor?.icon && allowEmpty) return null;

    return (
        <Image
            key={chainId}
            unoptimized
            src={networkDescriptor?.icon ?? ''}
            width={size}
            height={size}
            style={{
                width: `${size}px`,
                height: `${size}px`,
            }}
            alt={`Blockchain: ${chainId}`}
            className={className}
        />
    );
}
