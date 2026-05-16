import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';

import type { ChainId } from '@/ens/src/enums.js';
import type { Context, Provider } from '@/ens/src/types.js';

export const FIREFLY_API_URL = 'https://api-dev.firefly.land';

interface AddressByNameResponse {
    registrant: string;
    owner: string;
    wrapped_owner: string;
    resolved_address: string;
    display_address: string;
}

type DomainsByAddressResponse = Array<{
    address: string;
    domains: string[];
    reverseRecord: string;
}>;

async function fetchFromFirefly<T>(pathname: string, options: RequestInit, c: Context): Promise<T | undefined> {
    const response = await fetchJson<FireflyResponse<T>>(`${FIREFLY_API_URL}${pathname}`, {
        ...options,
        headers: {
            accept: 'application/json',
            ...options.headers,
        },
        context: c,
    });
    return resolveFireflyResponseData(response);
}

class FireflyDomainAPI implements Provider<ChainId> {
    id = 'firefly';

    async lookup(_chainId: ChainId, domain: string, c: Context): Promise<string | undefined> {
        if (!domain) return;

        const pathname = '/ens/v1/ens/addressByName';
        const params = new URLSearchParams({ name: domain });
        const url = `${pathname}?${params.toString()}`;

        const data = await fetchFromFirefly<AddressByNameResponse>(url, {}, c);
        const address = data?.resolved_address?.toLowerCase();
        return address;
    }

    async reverse(_chainId: ChainId, address: string, c: Context): Promise<string | undefined> {
        const pathname = '/ens/v1/ens/domainsByAddress';

        const data = await fetchFromFirefly<DomainsByAddressResponse>(
            pathname,
            {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({ addresses: [address] }),
            },
            c,
        );

        const domain = first(data)?.reverseRecord;
        return domain?.toLowerCase();
    }
}

export const FireflyDomain = new FireflyDomainAPI();
