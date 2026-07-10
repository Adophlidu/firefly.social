import { EMPTY_LIST } from '@dimensiondev/constants';
import { robinhood, solana } from '@dimensiondev/web3/chains';
import { SOL_NATIVE_TOKEN_ADDRESS } from '@dimensiondev/web3/constants';
import { uniq } from 'lodash-es';
import { useMemo } from 'react';
import { zeroAddress } from 'viem';
import { arbitrum, avalanche, bsc, fantom, mainnet, polygon, scroll } from 'viem/chains';

import { useOkxSupportedChains } from '@/components/TokenProfile/useOkxSupportedChains.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';

function getChainIdByCoinId(coinId: string) {
    const CoinIdToChainId: Record<string, number> = {
        ethereum: mainnet.id,
        'polygon-ecosystem-token': polygon.id,
        binancecoin: bsc.id,
        fantom: fantom.id,
        arbitrum: arbitrum.id,
        scroll: scroll.id,
        'avalanche-2': avalanche.id,
        solana: solana.id,
    };
    return CoinIdToChainId[coinId];
}

export function useTradeInfo(token: CoinGeckoToken | null | undefined, argChainId?: number, argAddress?: string) {
    const { data: trending } = useCoinTrending(token?.id);
    const { data: supportedChains = EMPTY_LIST } = useOkxSupportedChains();
    const { contracts = EMPTY_LIST } = trending ?? {};
    const chainIds = useMemo(
        () => uniq([...supportedChains.map((x) => x.chainId), solana.id, robinhood.id]),
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
        address: cgkChainId ? (cgkChainId === solana.id ? SOL_NATIVE_TOKEN_ADDRESS : zeroAddress) : address,
        supportedChainIds: chainIds,
    } as const;
}
