import { skipToken, useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import type { GetEnsNameParameters } from 'wagmi/actions';

import { STALE_TIMES } from '@/constants/query.js';
import { createDeduplicatedFetch } from '@/helpers/createDeduplicatedFetch.js';
import { reverse } from '@/services/ens.js';

const deduplicated = createDeduplicatedFetch<string | null>();

export async function fetchEnsName(parameters: GetEnsNameParameters) {
    const chainId = parameters.chainId || mainnet.id;
    return deduplicated(`${parameters.address}-${chainId}`, () => reverse(parameters.address));
}

export function useEnsName(address?: string, enabled = true) {
    return useQuery({
        queryKey: ['ensName', address?.toLowerCase()],
        enabled: !!address && enabled,
        staleTime: STALE_TIMES.INFINITY,
        retry: 5, // Retry 5 times
        queryFn: !address
            ? skipToken
            : () =>
                  fetchEnsName({
                      address: address as Address,
                      chainId: mainnet.id,
                  }),
    });
}
