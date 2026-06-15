import { isValidAddressEthereum, isValidDomainEthereum } from '@dimensiondev/web3/utils';
import { ensWorker } from '@dimensiondev/workers-client';

import type { ResponseJson } from '@/types/utility.js';

type LookupResponse = ResponseJson<{
    address: string | null;
}>;

type ReverseResponse = ResponseJson<{
    domain: string | null;
}>;

export async function lookup(domain: string): Promise<string | null> {
    const res = await ensWorker.ens.lookup.$get({ query: { domain } });
    const response = (await res.json()) as LookupResponse;
    if (!response.success) return null;
    return response.data.address?.toLowerCase() || null;
}

export async function reverse(address: string): Promise<string | null> {
    if (!isValidAddressEthereum(address)) return null;

    const res = await ensWorker.ens.reverse.$get({ query: { address } });
    const response = (await res.json()) as ReverseResponse;
    if (!response.success) return null;

    const domain = response.data.domain;
    if (!domain) return null;

    return isValidDomainEthereum(domain)
        ? domain.toLowerCase()
        : isValidDomainEthereum(`${domain}.eth`)
          ? `${domain}.eth`.toLowerCase()
          : null;
}
