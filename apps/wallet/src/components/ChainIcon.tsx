import arbitrumImage from '@dimensiondev/assets/chains/arbitrum.png';
import auroraImage from '@dimensiondev/assets/chains/aurora.png';
import avalancheImage from '@dimensiondev/assets/chains/avalanche.png';
import baseImage from '@dimensiondev/assets/chains/base.png';
import binanceImage from '@dimensiondev/assets/chains/binance.png';
import blastImage from '@dimensiondev/assets/chains/blast.png';
import celoImage from '@dimensiondev/assets/chains/celo.png';
import confluxImage from '@dimensiondev/assets/chains/conflux.png';
import ethereumImage from '@dimensiondev/assets/chains/ethereum.png';
import fantomImage from '@dimensiondev/assets/chains/fantom.png';
import lineaImage from '@dimensiondev/assets/chains/linea.png';
import metisImage from '@dimensiondev/assets/chains/metis.png';
import optimismImage from '@dimensiondev/assets/chains/optimism.png';
import plasmaImage from '@dimensiondev/assets/chains/plasma.png';
import polygonImage from '@dimensiondev/assets/chains/polygon.png';
import scrollImage from '@dimensiondev/assets/chains/scroll.png';
import solanaImage from '@dimensiondev/assets/chains/solana.png';
import xdaiImage from '@dimensiondev/assets/chains/xdai.png';
import xlayerImage from '@dimensiondev/assets/chains/xlayer.png';
import zksyncImage from '@dimensiondev/assets/chains/zksync.png';
import zoraImage from '@dimensiondev/assets/chains/zora.png';
import { isSameSolanaChainId, solana } from '@dimensiondev/web3/chains';
import { type HTMLProps, memo } from 'react';
import {
    arbitrum,
    aurora,
    avalanche,
    base,
    blast,
    bsc,
    celo,
    confluxESpace,
    fantom,
    gnosis,
    linea,
    mainnet,
    metis,
    optimism,
    plasma,
    polygon,
    scroll,
    xLayer,
    zkSync,
    zora,
} from 'viem/chains';

import { Image } from '@/components/Image.js';
import type { NetworkType } from '@/constants/enum.js';
import { cn } from '@/lib/utils.js';

const ICONS = [
    { icon: ethereumImage, chainId: mainnet.id },
    { icon: binanceImage, chainId: bsc.id },
    { icon: baseImage, chainId: base.id },
    { icon: polygonImage, chainId: polygon.id },
    { icon: arbitrumImage, chainId: arbitrum.id },
    { icon: xdaiImage, chainId: gnosis.id },
    { icon: scrollImage, chainId: scroll.id },
    { icon: avalancheImage, chainId: avalanche.id },
    { icon: auroraImage, chainId: aurora.id },
    { icon: confluxImage, chainId: confluxESpace.id },
    { icon: fantomImage, chainId: fantom.id },
    { icon: optimismImage, chainId: optimism.id },
    { icon: metisImage, chainId: metis.id },
    { icon: xlayerImage, chainId: xLayer.id },
    { icon: zoraImage, chainId: zora.id },
    { icon: celoImage, chainId: celo.id },
    { icon: zksyncImage, chainId: zkSync.id },
    { icon: lineaImage, chainId: linea.id },
    { icon: plasmaImage, chainId: plasma.id },
    { icon: solanaImage, chainId: solana.id },
    { icon: blastImage, chainId: blast.id },
];

interface ChainIconProps extends HTMLProps<HTMLImageElement> {
    networkType?: NetworkType;
    chainId: number | undefined;
    icon?: string;
    size?: number;
}

export const ChainIcon = memo(function ChainIcon({ chainId, icon, size = 22, className }: ChainIconProps) {
    const src = icon || ICONS.find((i) => isSameSolanaChainId(i.chainId, chainId))?.icon;

    if (!src) return null;

    return (
        <Image
            key={chainId}
            unoptimized
            src={src}
            width={size}
            height={size}
            style={{
                width: `${size}px`,
                height: `${size}px`,
            }}
            alt={`Blockchain: ${chainId}`}
            className={cn(`shrink-0 rounded-full`, className)}
        />
    );
});
