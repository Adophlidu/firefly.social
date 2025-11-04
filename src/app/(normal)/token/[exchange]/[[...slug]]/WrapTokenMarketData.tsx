'use client';
import { useQuery } from '@tanstack/react-query';
import { memo, useContext, useMemo } from 'react';

import { useUpdateContractParams } from '@/app/(normal)/token/[exchange]/[[...slug]]/useUpdateContractParams.js';
import { TokenContext } from '@/components/Token/TokenContext.js';
import { TokenMarketData, type TokenMarketDataProps } from '@/components/TokenProfile/TokenMarketData.js';
import { usePathname, useRouter, useSearchParams } from '@/esm/navigation.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useFollowingTraderCount(tokenId: string | null, chainId?: number, address?: string) {
    const search = useSearchParams();
    const finalChainId = chainId || (search.get('chainId') ? Number(search.get('chainId')) : undefined);
    const finalAddress = address || search.get('address');
    const { data: trending } = useCoinTrending(tokenId);
    const contracts = trending?.contracts;

    const tokens = useMemo(() => {
        const list: Array<{ chain_id: number; token_address: string }> = [];
        if (finalAddress && finalChainId) {
            list.push({ chain_id: finalChainId, token_address: finalAddress });
        }
        if (contracts?.length) {
            list.push(
                ...contracts
                    .filter((x) => isValidAddressEthereum(x.address) || isValidAddressSolana(x.address))
                    .map((x) => ({ chain_id: x.chainId!, token_address: x.address })),
            );
        }
        return list;
    }, [finalAddress, finalChainId, contracts]);

    const { data: traderCount } = useQuery({
        queryKey: ['following-trader-count', tokens],
        queryFn: async () => {
            if (!tokens.length) return 0;
            const data = await fireflyEndpointProvider.getFollowingTraderCount(tokens);
            return data?.total;
        },
    });
    return traderCount;
}

export const WrapTokenMarketData = memo(function WrapTokenMarketData(props: TokenMarketDataProps) {
    const router = useRouter();
    const pathname = usePathname();
    const search = useSearchParams();
    const { tradeRecords } = useContext(TokenContext);

    const chainId = search.get('chainId') ? Number(search.get('chainId')) : undefined;
    const address = search.get('address') || props.address || props.token.address;

    const followingTraderCount = useFollowingTraderCount(props.token.id, chainId, address);

    const updateContractParams = useUpdateContractParams();

    return (
        <TokenMarketData
            tradeRecords={tradeRecords}
            chainId={chainId || props.token.chainId}
            address={address}
            traderCount={followingTraderCount}
            range={search.get('range')}
            activeTradeHash={search.get('trade')}
            onContractChange={updateContractParams}
            onRangeChange={(range) => {
                const params = new URLSearchParams(search);
                params.set('range', range);
                router.replace(`${pathname}?${params.toString()}`);
            }}
            onTradeSelect={(hash) => {
                const chainId = tradeRecords.find((x) => x.hash === hash)?.chainId;
                if (!chainId) return;
                const params = new URLSearchParams(search);
                params.set('trade', hash);
                history.replaceState(Object.fromEntries(params.entries()), '', `${pathname}?${params.toString()}`);
                router.push(`/tx/${chainId}/${hash}`);
            }}
            {...props}
        />
    );
});
