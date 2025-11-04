import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { type HTMLProps, memo, useState } from 'react';

import { useFollowingTraderCount } from '@/app/(normal)/token/[exchange]/[[...slug]]/WrapTokenMarketData.js';
import { TokenMarketData, type TokenMarketDataProps } from '@/components/TokenProfile/TokenMarketData.js';
import { COINGECKO_SOL_COIN_ID, EMPTY_LIST, SWAP_SOL_NATIVE_ADDRESS } from '@/constants/index.js';
import { swapActivityToTradeRecord } from '@/helpers/swapActivityToTradeRecord.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useSingleCoin } from '@/hooks/useSingleCoin.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

interface FeaturedTokenProps extends HTMLProps<HTMLDivElement>, Pick<TokenMarketDataProps, 'token'> {}

export const FeaturedToken = memo<FeaturedTokenProps>(function FeaturedToken({ token, ...props }) {
    const { data: coin } = useSingleCoin(token.id);
    const profileIds = useCurrentProfileIds();
    const isLoginFirefly = useIsLoginFirefly();
    const swap = coin?.support_swap_platform[0];
    const defaultChainId = token?.chainId ?? (swap?.chainIndex ? +swap.chainIndex : undefined);
    const tokenAddress = token.id === COINGECKO_SOL_COIN_ID ? SWAP_SOL_NATIVE_ADDRESS : swap?.tokenContractAddress;

    const [chainId = defaultChainId, setChainId] = useState<number | undefined>(defaultChainId);
    const [address, setAddress] = useState<string>();

    const { data: tradeRecords = EMPTY_LIST } = useQuery({
        queryKey: ['swaps', 'following', 'first-100', profileIds, chainId, tokenAddress],
        queryFn: async () => {
            if (!isLoginFirefly || !tokenAddress) return null;
            return fireflyEndpointProvider.getFollowingSwapTimeline(
                chainId ? [chainId] : [],
                tokenAddress,
                undefined,
                100,
            );
        },
        select: (data) => {
            if (!data?.data || !tokenAddress) return EMPTY_LIST;
            const records = data.data.map((activity) => swapActivityToTradeRecord(activity, tokenAddress));
            return compact(records);
        },
    });
    const followingTraderCount = useFollowingTraderCount(token.id, chainId, address);

    return (
        <TokenMarketData
            {...props}
            tradeRecords={tradeRecords}
            traderCount={followingTraderCount}
            token={token}
            linkable
            chainId={chainId}
            address={address}
            onContractChange={(contract) => {
                setChainId(contract.chainId);
                setAddress(contract.address);
            }}
        />
    );
});
