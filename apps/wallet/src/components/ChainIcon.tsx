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
import { type HTMLProps, memo } from 'react';

import { Image } from '@/components/Image.js';
import { type NetworkType } from '@/constants/enum.js';
import { EthereumChainId } from '@/constants/ethereum.js';
import { SolanaChainId } from '@/constants/solana.js';
import { chainsMatch } from '@/helpers/isSolanaChain.js';
import { cn } from '@/lib/utils.js';

const ICONS = [
    { icon: ethereumImage, chainId: EthereumChainId.Mainnet },
    { icon: binanceImage, chainId: EthereumChainId.BSC },
    { icon: baseImage, chainId: EthereumChainId.Base },
    { icon: polygonImage, chainId: EthereumChainId.Polygon },
    { icon: arbitrumImage, chainId: EthereumChainId.Arbitrum },
    { icon: xdaiImage, chainId: EthereumChainId.xDai },
    { icon: scrollImage, chainId: EthereumChainId.Scroll },
    { icon: avalancheImage, chainId: EthereumChainId.Avalanche },
    { icon: auroraImage, chainId: EthereumChainId.Aurora },
    { icon: confluxImage, chainId: EthereumChainId.Conflux },
    { icon: fantomImage, chainId: EthereumChainId.Fantom },
    { icon: optimismImage, chainId: EthereumChainId.Optimism },
    { icon: metisImage, chainId: EthereumChainId.Metis },
    { icon: xlayerImage, chainId: EthereumChainId.XLayer },
    { icon: zoraImage, chainId: EthereumChainId.Zora },
    { icon: celoImage, chainId: EthereumChainId.Celo },
    { icon: zksyncImage, chainId: EthereumChainId.ZksyncEra },
    { icon: lineaImage, chainId: EthereumChainId.Linea },
    { icon: plasmaImage, chainId: EthereumChainId.Plasma },
    { icon: solanaImage, chainId: SolanaChainId.Mainnet },
    { icon: blastImage, chainId: EthereumChainId.Blast },
];

interface ChainIconProps extends HTMLProps<HTMLImageElement> {
    networkType?: NetworkType;
    chainId: number | undefined;
    icon?: string;
    size?: number;
}

export const ChainIcon = memo(function ChainIcon({ chainId, icon, size = 22, className }: ChainIconProps) {
    const src = icon || ICONS.find((i) => chainsMatch(i.chainId, chainId))?.icon;

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
