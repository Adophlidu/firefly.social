import { isValidAddressEthereum, isValidDomainEthereum } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { ResponseJson } from '@/types/utility.js';

type LookupResponse = ResponseJson<{
    address: string | null;
}>;

type ReverseResponse = ResponseJson<{
    domain: string | null;
}>;

export async function lookup(domain: string): Promise<string | null> {
    const response = await fetchJson<LookupResponse>(urlcat(FIREFLY_WORKER_HOST, '/ens/lookup', { domain }));
    if (!response.success) return null;
    return response.data.address?.toLowerCase() || null;
}

export async function reverse(address: string): Promise<string | null> {
    if (!isValidAddressEthereum(address)) return null;

    const response = await fetchJson<ReverseResponse>(urlcat(FIREFLY_WORKER_HOST, '/ens/reverse', { address }));
    if (!response.success) return null;

    const domain = response.data.domain;
    if (!domain) return null;

    return isValidDomainEthereum(domain)
        ? domain.toLowerCase()
        : isValidDomainEthereum(`${domain}.eth`)
          ? `${domain}.eth`.toLowerCase()
          : null;
}
