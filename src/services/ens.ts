import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import type { ResponseJSON } from '@/types/index.js';

type LookupResponse = ResponseJSON<{
    address: string | null;
}>;

type ReverseResponse = ResponseJSON<{
    domain: string | null;
}>;

export async function lookup(domain: string): Promise<string | null> {
    const response = await fetchJSON<LookupResponse>(urlcat(FIREFLY_WORKER_HOST, '/ens/lookup', { domain }));
    if (!response.success) return null;
    return response.data.address?.toLowerCase() || null;
}

export async function reverse(address: string): Promise<string | null> {
    if (!isValidAddressEthereum(address)) return null;

    const response = await fetchJSON<ReverseResponse>(urlcat(FIREFLY_WORKER_HOST, '/ens/reverse', { address }));
    if (!response.success) return null;

    const domain = response.data.domain;
    if (!domain) return null;

    return isValidDomainEthereum(domain)
        ? domain.toLowerCase()
        : isValidDomainEthereum(`${domain}.eth`)
          ? `${domain}.eth`.toLowerCase()
          : null;
}
