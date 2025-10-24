import { first } from 'lodash-es';
import { memo, useEffect, useMemo } from 'react';

import { Loading } from '@/components/Loading.js';
import { useTradeInfo } from '@/components/TokenProfile/useTradeInfo.js';
import { EMPTY_LIST, TRACING_RUNTIME_LIST } from '@/constants/index.js';
import { NATIVE_TOKEN_ADDRESS } from '@/constants/okx.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSearchParams } from '@/esm/navigation.js';
import { isZeroAddress } from '@/helpers/isZeroAddress.js';
import { resolveCoinGeckoChain } from '@/helpers/resolveCoinGeckoChain.js';
import { resolveCoinGeckoCoinChainId } from '@/helpers/resolveCoingeckoCoinChainId.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import type { Contract } from '@/providers/types/Trending.js';
import { useSwapStore } from '@/store/useSwapStore.js';

const SwapModalContent = dynamic(
    () => import('@/modals/SwapModal/SwapModalContent.js').then((m) => m.SwapModalContent),
    {
        ssr: false,
        loading: () => <Loading className="h-[562px]" />,
    },
);

interface Props {
    chainId?: number;
    address?: string;
    token: CoinGeckoToken | null | undefined;
}
export const Swap = memo(function Swap({ token, chainId: propChainId, address: propAddress }: Props) {
    const search = useSearchParams();
    const runtimeAddress = search.get('address') || propAddress || token?.address;
    const { data: trending } = useCoinTrending(token?.id);
    const coinChainId = token?.id ? resolveCoinGeckoCoinChainId(token.id) : undefined;

    const contracts = useMemo(() => {
        if (trending?.contracts) {
            const contracts = trending.contracts.filter((x) => TRACING_RUNTIME_LIST.includes(x.runtime));
            if (coinChainId && contracts.length)
                return [
                    {
                        runtime: resolveCoinGeckoChain(coinChainId),
                        chainId: coinChainId,
                        address: NATIVE_TOKEN_ADDRESS,
                    } as Contract,
                    ...contracts,
                ];
            return contracts;
        }
        if (propChainId && !isZeroAddress(runtimeAddress))
            return [
                {
                    runtime: resolveCoinGeckoChain(propChainId),
                    chainId: propChainId,
                    address: runtimeAddress,
                } as Contract,
            ];
        return EMPTY_LIST;
    }, [coinChainId, propChainId, runtimeAddress, trending?.contracts]);
    const firstContract = first(contracts);
    const chainId = propChainId || firstContract?.chainId;
    const contract = (chainId ? contracts?.find((x) => x.chainId === chainId) : null) || firstContract;
    const address = runtimeAddress || contract?.address;
    const tradeInfo = useTradeInfo(token, chainId, address);
    const tradeChainId = chainId || tradeInfo.chainId;

    const swapOptions = useMemo(() => {
        return tradeChainId
            ? {
                  toToken: address || tradeInfo.address,
                  chainId: tradeChainId,
                  chainIds: tradeInfo.supportedChainIds?.map((x) => x.toString()),
              }
            : {
                  toToken: address || tradeInfo.address,
                  chainId,
              };
    }, [address, chainId, tradeChainId, tradeInfo.address, tradeInfo.supportedChainIds]);

    const { sidebarSwapOptions, setSidebarSwapReady, setSidebarSwapOptions } = useSwapStore();
    useEffect(() => {
        setSidebarSwapReady(true);
        return () => {
            setSidebarSwapReady(false);
            setSidebarSwapOptions(undefined);
        };
    }, [setSidebarSwapOptions, setSidebarSwapReady]);

    return (
        <SwapModalContent
            props={sidebarSwapOptions || swapOptions}
            embed
            open
            className="h-[562px] [&_.self-content]:flex-1"
        />
    );
});
