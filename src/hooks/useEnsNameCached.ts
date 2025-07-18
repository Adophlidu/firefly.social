import { skipToken, useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { type GetEnsNameParameters } from 'wagmi/actions';
import { reverse } from '@/services/ens.js';

const runningQueries = new Map<string, Promise<string | null>>();

export async function fetchEnsName(parameters: GetEnsNameParameters) {
    const { address } = parameters;
    const chainId = parameters.chainId || mainnet.id;
    const cacheKey = `${address}-${chainId}`;

    if (!runningQueries.has(cacheKey)) {
        const promise = reverse(parameters.address);
        runningQueries.set(cacheKey, promise);
        promise.finally(() => {
            runningQueries.delete(cacheKey);
        });
    }

    return runningQueries.get(cacheKey)!;
}

export function useEnsNameCached(address?: string, parameters?: Omit<GetEnsNameParameters, 'address'>, enabled = true) {
    const chainId = parameters?.chainId || mainnet.id;

    return useQuery({
        queryKey: ['ensName', address, chainId],
        enabled: !!address && enabled,
        staleTime: Infinity,
        retry: 5, // Retry 5 times
        queryFn: !address
            ? skipToken
            : async () => {
                  return fetchEnsName({
                      ...parameters,
                      address: address as Address,
                      chainId,
                  });
              },
    });
}
