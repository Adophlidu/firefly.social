import { skipToken, useQueries, useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';

import { EnsNameSource } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { createDeduplicatedFetch } from '@/helpers/createDeduplicatedFetch.js';
import { fetchAddressByEnsName } from '@/services/fetchAddressByEnsName.js';

const deduplicated = createDeduplicatedFetch<string | null>();

function resolveEnsNameSource(name: string): EnsNameSource {
    if (name.endsWith('.base.eth')) return EnsNameSource.Base;
    if (name.endsWith('.sol')) return EnsNameSource.Sns;
    if (name.endsWith('.skr')) return EnsNameSource.Skr;
    return EnsNameSource.Eth;
}

async function fetchEnsAddress(name: string, nameSource: EnsNameSource) {
    return deduplicated(`${nameSource}-${name}`, () => fetchAddressByEnsName(name, nameSource));
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
                  const address = await fetchEnsAddress(name, resolveEnsNameSource(name));
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
                      const address = await fetchEnsAddress(name, resolveEnsNameSource(name));
                      return address as Address | null;
                  },
        })),
    });
}
