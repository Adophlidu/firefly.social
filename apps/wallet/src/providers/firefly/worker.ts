import type { ServerErrorCodes } from '@dimensiondev/enums';
import { isValidAddressEthereum, isValidDomainEthereum } from '@dimensiondev/web3/utils';
import { bskyIdentityWorker, ensWorker } from '@dimensiondev/workers-client';

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

export class FireflyWorkerEndpoint {
    async lookup(domain: string, options?: { signal?: AbortSignal }): Promise<string | null> {
        const res = await ensWorker.ens.lookup.$get({ query: { domain } }, { init: { signal: options?.signal } });
        const data = (await res.json()) as LookupResponse;
        if (!data.success) return null;
        return data.data.address?.toLowerCase() || null;
    }

    async convertBskyHandleToDid(handle: string) {
        const res = await bskyIdentityWorker['bsky-identity']['resolve-handle'].$get({ query: { handle } });
        const response = (await res.json()) as ResponseJson<{ did: string }>;
        if (!response.success) return null;
        return response.data.did;
    }

    async reverse(address: string): Promise<string | null> {
        if (!isValidAddressEthereum(address)) return null;
        const res = await ensWorker.ens.reverse.$get({ query: { address } });
        const data = (await res.json()) as ReverseResponse;
        if (!data.success) return null;

        const domain = data.data.domain;
        if (!domain) return null;

        if (isValidDomainEthereum(domain)) return domain.toLowerCase();

        const fallback = `${domain}.eth`;
        return isValidDomainEthereum(fallback) ? fallback.toLowerCase() : null;
    }
}

export const fireflyWorkerEndpoint = new FireflyWorkerEndpoint();
