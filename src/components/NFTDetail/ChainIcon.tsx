'use client';

import { isValidChainId as isValidSolanaChainId } from '@masknet/web3-shared-solana';
import type { HTMLProps } from 'react';

import { Image } from '@/components/Image.js';
import { NetworkPluginID, NetworkType } from '@/constants/enum.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';

interface ChainIconProps extends HTMLProps<HTMLImageElement> {
    networkType?: NetworkType;
    chainId: number;
    size?: number;
}

export function ChainIcon({ chainId, size = 22, className, networkType }: ChainIconProps) {
    const networkDescriptor =
        isValidSolanaChainId(chainId) || networkType === NetworkType.Solana
            ? getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, chainId)
            : getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, chainId);

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
