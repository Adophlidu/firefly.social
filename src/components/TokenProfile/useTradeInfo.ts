import { uniq } from 'lodash-es';
import { useMemo } from 'react';
import { zeroAddress } from 'viem';

import { useOkxSupportedChains } from '@/components/TokenProfile/useOkxSupportedChains.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { getChainIdByCoinId } from '@/providers/coingecko/getChainIdByCoinId.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function useTradeInfo(token: CoinGeckoToken | null | undefined, argChainId?: number, argAddress?: string) {
    const { data: trending } = useCoinTrending(token?.id);
    const { data: supportedChains = EMPTY_LIST } = useOkxSupportedChains();
    const { contracts = [] } = trending ?? {};
    const chainIds = useMemo(
        () => uniq([...supportedChains.map((x) => x.chainId), SolanaChainId.Mainnet]),
        [supportedChains],
    );
    const firstAvailable = contracts.find((x) => x.chainId && chainIds.includes(x.chainId));
    const coingeckoChainId = token?.id ? getChainIdByCoinId(token.id) : undefined;
    const chainId = argChainId || coingeckoChainId || token?.chainId || firstAvailable?.chainId;

    if (!chainId || !chainIds.includes(chainId))
        return {
            tradable: false,
        } as const;

    const address = argAddress || token?.address || firstAvailable?.address;

    return {
        tradable: true,
        chainId,
        address: coingeckoChainId ? zeroAddress : address,
        supportedChainIds: chainIds,
    } as const;
}
