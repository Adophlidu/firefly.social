import { EMPTY_LIST } from '@dimensiondev/constants';
import { SOL_NATIVE_TOKEN_ADDRESS } from '@dimensiondev/web3-utils';
import { uniq } from 'lodash-es';
import { useMemo } from 'react';
import { zeroAddress } from 'viem';

import { useOkxSupportedChains } from '@/components/TokenProfile/useOkxSupportedChains.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

function getChainIdByCoinId(coinId: string) {
    const CoinIdToChainId: Record<string, number> = {
        ethereum: EthereumChainId.Mainnet,
        'polygon-ecosystem-token': EthereumChainId.Polygon,
        binancecoin: EthereumChainId.BSC,
        fantom: EthereumChainId.Fantom,
        arbitrum: EthereumChainId.Arbitrum,
        scroll: EthereumChainId.Scroll,
        'avalanche-2': EthereumChainId.Avalanche,
        solana: SolanaChainId.Mainnet,
    };
    return CoinIdToChainId[coinId];
}

export function useTradeInfo(token: CoinGeckoToken | null | undefined, argChainId?: number, argAddress?: string) {
    const { data: trending } = useCoinTrending(token?.id);
    const { data: supportedChains = EMPTY_LIST } = useOkxSupportedChains();
    const { contracts = EMPTY_LIST } = trending ?? {};
    const chainIds = useMemo(
        () => uniq([...supportedChains.map((x) => x.chainId), SolanaChainId.Mainnet]),
        [supportedChains],
    );
    const firstAvailable = contracts.find((x) => x.chainId && chainIds.includes(x.chainId));
    const cgkChainId = token?.id ? getChainIdByCoinId(token.id) : undefined;
    const chainId = argChainId || cgkChainId || token?.chainId || firstAvailable?.chainId;

    if (!chainId || !chainIds.includes(chainId))
        return {
            tradable: false,
        } as const;

    const address = argAddress || token?.address || firstAvailable?.address;

    return {
        tradable: true,
        chainId,
        address: cgkChainId ? (cgkChainId === SolanaChainId.Mainnet ? SOL_NATIVE_TOKEN_ADDRESS : zeroAddress) : address,
        supportedChainIds: chainIds,
    } as const;
}
