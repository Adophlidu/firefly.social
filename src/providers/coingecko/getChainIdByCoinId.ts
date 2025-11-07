import { EthereumChainId } from '@/web3-shared/evm/types.js';

export function getChainIdByCoinId(coinId: string) {
    const CoinIdToChainId: Record<string, EthereumChainId> = {
        ethereum: EthereumChainId.Mainnet,
        'polygon-ecosystem-token': EthereumChainId.Polygon,
        binancecoin: EthereumChainId.BSC,
        fantom: EthereumChainId.Fantom,
        arbitrum: EthereumChainId.Arbitrum,
        scroll: EthereumChainId.Scroll,
        'avalanche-2': EthereumChainId.Avalanche,
    };
    return CoinIdToChainId[coinId];
}
