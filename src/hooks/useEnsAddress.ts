import { skipToken, useQueries, useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';
import { mainnet } from 'viem/chains';
import { type GetEnsAddressParameters } from 'wagmi/actions';

import { lookup } from '@/services/ens.js';

const runningQueries = new Map<string, Promise<string | null>>();

async function fetchEnsAddress(parameters: GetEnsAddressParameters) {
    const { name } = parameters;
    const chainId = parameters.chainId || mainnet.id;
    const cacheKey = `${name}-${chainId}`;

    if (!runningQueries.has(cacheKey)) {
        runningQueries.set(
            cacheKey,
            lookup(parameters.name).finally(() => runningQueries.delete(cacheKey)),
        );
    }

    return runningQueries.get(cacheKey)!;
}

export function useEnsAddress(name?: string, enabled = true) {
    return useQuery({
        queryKey: ['ensAddress', name],
        enabled: !!name && enabled,
        staleTime: Infinity,
        retry: 5, // Retry 5 times
        queryFn: !name
            ? skipToken
            : async () => {
                  const address = await fetchEnsAddress({
                      name,
                      chainId: mainnet.id,
                  });
                  return address as Address;
              },
    });
}

export function useEnsAddresses(names?: string[], enabled = true) {
    return useQueries({
        queries: (names || []).map((name) => ({
            queryKey: ['ensAddress', name],
            enabled: !!name && enabled,
            staleTime: Infinity,
            retry: 5, // Retry 5 times
            queryFn: !name
                ? skipToken
                : async () => {
                      const address = await fetchEnsAddress({
                          name,
                          chainId: mainnet.id,
                      });
                      return address as Address | null;
                  },
        })),
    });
}
