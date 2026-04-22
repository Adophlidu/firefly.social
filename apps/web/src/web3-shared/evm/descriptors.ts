import { chains } from '@dimensiondev/web3/chains';
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
    lens,
    linea,
    mainnet,
    mantle,
    metis,
    optimism,
    plasma,
    polygon,
    scroll,
    xLayer,
    zkSync,
    zora,
} from 'viem/chains';

import { NetworkPluginID } from '@/constants/enum.js';
import type { NetworkDescriptor } from '@/web3-shared/base/specs.js';

const PLUGIN_ID = NetworkPluginID.PLUGIN_EVM;

interface ChainMeta {
    name?: string;
    shortName?: string;
    icon: string;
    iconColor: string;
    backgroundGradient?: string;
    averageBlockDelay?: number;
    nativeTokenLogoURL?: string;
    features?: string[];
}

const ETH_LOGO =
    'https://imagedelivery.net/PCnTHRkdRhGodr0AWBAvMA/Assets/blockchains/ethereum/info/logo.png/quality=85';

const CHAIN_META: Partial<Record<number, ChainMeta>> = {
    [mainnet.id]: {
        name: 'Ethereum',
        shortName: 'ETH',
        icon: '/image/chains/ethereum.png',
        iconColor: 'rgb(28, 104, 243)',
        backgroundGradient:
            'linear-gradient(180deg, rgba(98, 126, 234, 0.15) 0%, rgba(98, 126, 234, 0.05) 100%), rgba(255, 255, 255, 0.2)',
        averageBlockDelay: 10,
        nativeTokenLogoURL: ETH_LOGO,
        features: ['EIP1559'],
    },
    [bsc.id]: {
        name: 'BNB Chain',
        icon: '/image/chains/binance.png',
        iconColor: 'rgb(240, 185, 10)',
        backgroundGradient: 'linear-gradient(180deg, rgba(243, 186, 47, 0.15) 0%, rgba(243, 186, 47, 0.05) 100%)',
        averageBlockDelay: 10,
        nativeTokenLogoURL:
            'https://imagedelivery.net/PCnTHRkdRhGodr0AWBAvMA/Assets/blockchains/smartchain/info/logo.png/quality=85',
    },
    [base.id]: {
        name: 'Base',
        icon: '/image/chains/base.png',
        iconColor: 'rgb(0, 82, 255)',
        backgroundGradient: 'linear-gradient(180deg, rgba(130, 71, 229, 0.15) 0%, rgba(130, 71, 229, 0.05) 100%)',
        averageBlockDelay: 10,
        nativeTokenLogoURL: ETH_LOGO,
    },
    [polygon.id]: {
        name: 'Polygon',
        icon: '/image/chains/polygon.png',
        iconColor: 'rgb(119, 62, 225)',
        backgroundGradient: 'linear-gradient(180deg, rgba(130, 71, 229, 0.15) 0%, rgba(130, 71, 229, 0.05) 100%)',
        averageBlockDelay: 10,
        nativeTokenLogoURL:
            'https://imagedelivery.net/PCnTHRkdRhGodr0AWBAvMA/Assets/blockchains/polygon/info/logo.png/quality=85',
        features: ['EIP1559'],
    },
    [arbitrum.id]: {
        name: 'Arbitrum One',
        shortName: 'Arbitrum',
        icon: '/image/chains/arbitrum.png',
        iconColor: 'rgb(36, 150, 238)',
        backgroundGradient: 'linear-gradient(180deg, rgba(40, 160, 240, 0.15) 0%, rgba(40, 160, 240, 0.05) 100%)',
        averageBlockDelay: 10,
        nativeTokenLogoURL: ETH_LOGO,
    },
    [gnosis.id]: {
        name: 'Gnosis',
        icon: '/image/chains/xdai.png',
        iconColor: 'rgb(73, 169, 166)',
        backgroundGradient: 'linear-gradient(180deg, rgba(72, 168, 166, 0.15) 0%, rgba(72, 168, 166, 0.05) 100%)',
        averageBlockDelay: 10,
    },
    [scroll.id]: {
        name: 'Scroll',
        icon: 'https://static.debank.com/image/chain/logo_url/scrl/1fa5c7e0bfd353ed0a97c1476c9c42d2.png',
        iconColor: 'rgb(255, 248, 243)',
        backgroundGradient:
            'linear-gradient(180deg, rgba(98, 126, 234, 0.15) 0%, rgba(98, 126, 234, 0.05) 100%), rgba(255, 255, 255, 0.2)',
        averageBlockDelay: 9,
        nativeTokenLogoURL: ETH_LOGO,
    },
    [avalanche.id]: {
        name: 'Avalanche',
        shortName: 'AVAX',
        icon: '/image/chains/avalanche.png',
        iconColor: 'rgb(232, 65, 66)',
        backgroundGradient: 'linear-gradient(180deg, rgba(232, 65, 66, 0.15) 0%, rgba(232, 65, 66, 0.05) 100%)',
        averageBlockDelay: 10,
        nativeTokenLogoURL:
            'https://imagedelivery.net/PCnTHRkdRhGodr0AWBAvMA/Assets/blockchains/avalanchec/info/logo.png/quality=85',
    },
    [aurora.id]: {
        name: 'Aurora',
        icon: '/image/chains/aurora.png',
        iconColor: 'rgb(112, 212, 74)',
        backgroundGradient: 'linear-gradient(180deg, rgba(112, 212, 75, 0.15) 0%, rgba(112, 212, 75, 0.05) 100%)',
        averageBlockDelay: 10,
        nativeTokenLogoURL: ETH_LOGO,
    },
    [confluxESpace.id]: {
        name: 'Conflux',
        icon: '/image/chains/conflux.png',
        iconColor: 'rgb(112, 212, 74)',
        backgroundGradient: 'linear-gradient(180deg, rgba(72, 168, 166, 0.15) 0%, rgba(72, 168, 166, 0.05) 100%)',
        averageBlockDelay: 10,
    },
    [fantom.id]: {
        name: 'Fantom',
        icon: '/image/chains/fantom.png',
        iconColor: 'rgb(73, 169, 166)',
        backgroundGradient: 'linear-gradient(180deg, rgba(24, 94, 255, 0.15) 0%, rgba(24, 94, 255, 0.05) 100%)',
        averageBlockDelay: 10,
        nativeTokenLogoURL:
            'https://imagedelivery.net/PCnTHRkdRhGodr0AWBAvMA/Assets/blockchains/fantom/info/logo.png/quality=85',
    },
    [xLayer.id]: {
        name: 'X Layer',
        icon: '/image/chains/xlayer.png',
        iconColor: 'rgb(255, 255, 255)',
        averageBlockDelay: 10,
        nativeTokenLogoURL:
            'https://static.okx.com/cdn/wallet/logo/okb.png?x-oss-process=image/format,webp/ignore-error,1',
    },
    [metis.id]: {
        name: 'Metis',
        icon: 'https://static.debank.com/image/chain/logo_url/metis/7485c0a61c1e05fdf707113b6b6ac917.png',
        iconColor: 'rgb(36, 150, 238)',
        backgroundGradient: 'linear-gradient(180deg, rgba(130, 71, 229, 0.15) 0%, rgba(130, 71, 229, 0.05) 100%)',
        averageBlockDelay: 10,
        nativeTokenLogoURL: 'https://bridge.metis.io/static/media/logo.f1bdb422692299f1b236d7144106b7af.svg',
    },
    [zora.id]: {
        name: 'Zora',
        icon: 'https://static.debank.com/image/chain/logo_url/zora/de39f62c4489a2359d5e1198a8e02ef1.png',
        iconColor: '#3059AE',
        averageBlockDelay: 10,
        nativeTokenLogoURL: ETH_LOGO,
    },
    [celo.id]: {
        name: 'Celo',
        icon: '/image/chains/celo.png',
        iconColor: '#FCFF52',
        averageBlockDelay: 10,
    },
    [zkSync.id]: {
        name: 'Zksync Era',
        icon: '/image/chains/zksync.png',
        iconColor: '#3059AE',
        averageBlockDelay: 10,
        nativeTokenLogoURL: ETH_LOGO,
    },
    [linea.id]: {
        name: 'Linea',
        icon: '/image/chains/linea.png',
        iconColor: '#3059AE',
        averageBlockDelay: 10,
        nativeTokenLogoURL: ETH_LOGO,
    },
    [plasma.id]: {
        name: 'Plasma',
        icon: '/image/chains/plasma.png',
        iconColor: '#3059AE',
        averageBlockDelay: 10,
        nativeTokenLogoURL: ETH_LOGO,
    },
    [blast.id]: {
        name: 'Blast',
        icon: '/image/chains/blast.png',
        iconColor: 'rgb(252, 236, 222)',
        averageBlockDelay: 2,
        nativeTokenLogoURL: ETH_LOGO,
    },
    [optimism.id]: {
        name: 'Optimism',
        icon: '/image/chains/optimism.png',
        iconColor: 'rgb(232, 65, 66)',
        backgroundGradient: 'linear-gradient(180deg, rgba(232, 65, 66, 0.15) 0%, rgba(232, 65, 66, 0.05) 100%)',
        averageBlockDelay: 10,
        nativeTokenLogoURL: ETH_LOGO,
    },
    [lens.id]: {
        name: 'Lens',
        icon: 'https://explorer.lens.xyz/images/gho.png',
        iconColor: 'rgb(170, 221, 55)',
        averageBlockDelay: 10,
        nativeTokenLogoURL: 'https://explorer.lens.xyz/images/gho.png',
    },
    [mantle.id]: {
        name: 'Mantle',
        icon: 'https://static.debank.com/image/chain/logo_url/mantle/2feecb18b9e8e63f29fdb39ca2c46ed0.png',
        iconColor: 'rgb(0, 148, 100)',
        averageBlockDelay: 10,
    },
};

const DEFAULT_META: ChainMeta = {
    icon: '/image/chains/ethereum.png',
    iconColor: 'rgb(138, 138, 138)',
    averageBlockDelay: 10,
};

export const NETWORK_DESCRIPTORS: ReadonlyArray<NetworkDescriptor<number>> = chains.map(
    (chain): NetworkDescriptor<number> => {
        const meta = CHAIN_META[chain.id] ?? DEFAULT_META;
        const name = meta.name ?? chain.name;
        return {
            ID: `${PLUGIN_ID}_${name.toLowerCase().replace(/\s+/g, '_')}`,
            networkSupporterPluginID: PLUGIN_ID,
            chainId: chain.id,
            name,
            shortName: meta.shortName,
            icon: meta.icon,
            iconColor: meta.iconColor as NetworkDescriptor<number>['iconColor'],
            backgroundGradient: meta.backgroundGradient,
            averageBlockDelay: meta.averageBlockDelay ?? 10,
            isMainnet: !chain.testnet,
        };
    },
);
