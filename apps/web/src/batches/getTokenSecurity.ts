import { GO_PLUS_LABS_ROOT_URL } from '@dimensiondev/constants/static';
import { createBatcher } from '@dimensiondev/utils';
import { isEmpty } from 'lodash-es';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { createSecurityResult } from '@/providers/goplus/createSecurityResult.js';
import { TokenSecurityMessages } from '@/providers/goplus/rules.js';
import type { GoPlusResponse, TokenContractSecurity } from '@/providers/types/Security.js';

interface TokenSecurityPayload {
    chainId: number;
    address: string;
}

type TokenSecurity = TokenContractSecurity & { contract: string; chainId: number };
type TokenSecurityResult = ReturnType<typeof createSecurityResult<TokenSecurity>>;

function makeKey(chainId: number, address: string) {
    return `${chainId}:${address.toLowerCase()}`;
}

async function fetcher(payloads: TokenSecurityPayload[]): Promise<Record<string, TokenSecurityResult>> {
    if (payloads.length === 0) return {};

    // The endpoint accepts a single chain per request, so group addresses by chainId.
    const addressesByChainId = new Map<number, string[]>();
    for (const { chainId, address } of payloads) {
        const addresses = addressesByChainId.get(chainId);
        if (addresses) addresses.push(address.toLowerCase());
        else addressesByChainId.set(chainId, [address.toLowerCase()]);
    }

    const records = await Promise.all(
        Array.from(addressesByChainId, async ([chainId, addresses]) => {
            const url = urlcat(GO_PLUS_LABS_ROOT_URL, 'api/v1/token_security/:chainId', {
                chainId,
                contract_addresses: addresses.join(','),
            });
            const res = await fetchJson<GoPlusResponse<Record<string, TokenContractSecurity>>>(url);
            return [chainId, res.result] as const;
        }),
    );

    const result: Record<string, TokenSecurityResult> = {};
    for (const [chainId, securities] of records) {
        if (isEmpty(securities)) continue;

        for (const [contract, value] of Object.entries(securities)) {
            const security = { ...value, contract, chainId };
            result[makeKey(chainId, contract)] = createSecurityResult(
                security,
                TokenSecurityMessages,
                (info) => info.trust_list === '1',
            );
        }
    }

    return result;
}

const batchedGetTokenSecurity = createBatcher<TokenSecurityPayload, TokenSecurityResult>('getTokenSecurity', fetcher, {
    makeKey: (payload) => makeKey(payload.chainId, payload.address),
    size: 100,
    wait: 100,
});

export async function getTokenSecurity(chainId: number, address: string) {
    const result = await batchedGetTokenSecurity({ chainId, address });
    return result ?? null;
}
