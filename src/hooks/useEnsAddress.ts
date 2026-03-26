import { skipToken, useQueries, useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';
import { mainnet } from 'viem/chains';
import { type GetEnsAddressParameters } from 'wagmi/actions';

import { STALE_TIMES } from '@/constants/query.js';
import { createDeduplicatedFetch } from '@/helpers/createDeduplicatedFetch.js';
import { lookup } from '@/services/ens.js';

const deduplicated = createDeduplicatedFetch<string | null>();

async function fetchEnsAddress(parameters: GetEnsAddressParameters) {
    const chainId = parameters.chainId || mainnet.id;
    return deduplicated(`${parameters.name}-${chainId}`, () => lookup(parameters.name));
}

export function useEnsAddress(name?: string, enabled = true) {
    return useQuery({
        queryKey: ['ensAddress', name],
        enabled: !!name && enabled,
        staleTime: STALE_TIMES.INFINITY,
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
            staleTime: STALE_TIMES.INFINITY,
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
