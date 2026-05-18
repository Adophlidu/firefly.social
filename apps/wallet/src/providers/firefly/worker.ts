import type { ServerErrorCodes } from '@dimensiondev/enums';
import { isValidAddressEthereum, isValidDomainEthereum } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { Fetch } from '@/lib/Fetch.js';

export type ResponseJson<T> =
    | {
          success: true;
          data: T;
      }
    | {
          success: false;
          error: {
              code: ServerErrorCodes;
              message: string;
          };
      };

type LookupResponse = ResponseJson<{
    address: string | null;
}>;

type ReverseResponse = ResponseJson<{
    domain: string | null;
}>;

export class FireflyWorkerEndpoint extends Fetch {
    async lookup(domain: string, options?: { signal?: AbortSignal }): Promise<string | null> {
        const { data } = await this.get<LookupResponse>(urlcat('/ens/lookup', { domain }), {
            signal: options?.signal,
        });
        if (!data.success) return null;
        return data.data.address?.toLowerCase() || null;
    }

    async convertBskyHandleToDid(handle: string) {
        const result = await this.get<ResponseJson<{ did: string }>>(
            urlcat('/bsky-identity/resolve-handle', {
                handle,
            }),
        );
        const response = result.data;
        if (!response.success) return null;
        return response.data.did;
    }

    async reverse(address: string): Promise<string | null> {
        if (!isValidAddressEthereum(address)) return null;
        const { data } = await this.get<ReverseResponse>(urlcat('/ens/reverse', { address }));
        if (!data.success) return null;

        const domain = data.data.domain;
        if (!domain) return null;

        if (isValidDomainEthereum(domain)) return domain.toLowerCase();

        const fallback = `${domain}.eth`;
        return isValidDomainEthereum(fallback) ? fallback.toLowerCase() : null;
    }
}

export const fireflyWorkerEndpoint = new FireflyWorkerEndpoint({
    baseURL: FIREFLY_WORKER_HOST,
});
