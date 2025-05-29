'use client';
import { useQuery } from '@tanstack/react-query';
import { memo, useContext, useMemo } from 'react';

import { TokenContext } from '@/components/Token/TokenContext.js';
import { TokenMarketData, type TokenMarketDataProps } from '@/components/TokenProfile/TokenMarketData.js';
import { useSearchParams } from '@/esm/navigation.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useFollowingTraderCount(tokenId: string | null) {
    const search = useSearchParams();
    const chainId = search.get('chainId') ? Number(search.get('chainId')) : undefined;
    const address = search.get('address');
    const { data: trending } = useCoinTrending(tokenId);
    const contracts = trending?.contracts;

    const tokens = useMemo(() => {
        const list: Array<{ chain_id: number; token_address: string }> = [];
        if (address && chainId) {
            list.push({ chain_id: chainId, token_address: address });
        }
        if (contracts?.length) {
            list.push(
                ...contracts
                    .filter((x) => isValidAddressEthereum(x.address) || isValidAddressSolana(x.address))
                    .map((x) => ({ chain_id: x.chainId!, token_address: x.address })),
            );
        }
        return list;
    }, [address, chainId, contracts]);

    const { data: traderCount } = useQuery({
        queryKey: ['following-trader-count', tokens],
        queryFn: async () => {
            if (!tokens.length) return 0;
            const data = await FireflyEndpointProvider.getFollowingTraderCount(tokens);
            return data?.total;
        },
    });
    return traderCount;
}

export const WrapTokenMarketData = memo(function WrapTokenMarketData(props: TokenMarketDataProps) {
    const search = useSearchParams();
    const chainId = search.get('chainId') ? Number(search.get('chainId')) : undefined;
    const { tradeRecords } = useContext(TokenContext);

    const followingTraderCount = useFollowingTraderCount(props.token.id);

    return (
        <TokenMarketData tradeRecords={tradeRecords} chainId={chainId} traderCount={followingTraderCount} {...props} />
    );
});
