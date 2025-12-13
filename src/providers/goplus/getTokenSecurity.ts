import { first, isEmpty } from 'lodash-es';
import urlcat from 'urlcat';

import { GO_PLUS_LABS_ROOT_URL } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createSecurityResult } from '@/providers/goplus/createSecurityResult.js';
import { TokenSecurityMessages } from '@/providers/goplus/rules.js';
import type { GoPlusResponse, TokenContractSecurity } from '@/providers/types/Security.js';

export async function getTokenSecurity(chainId: number, address: string) {
    const url = urlcat(GO_PLUS_LABS_ROOT_URL, 'api/v1/token_security/:chainId', {
        chainId,
        contract_addresses: address.toLowerCase(),
    });

    const res = await fetchJson<GoPlusResponse<Record<string, TokenContractSecurity>>>(url);
    if (isEmpty(res.result)) return;

    const entity = first(Object.entries(res.result));
    if (!entity) return;

    const security = { ...entity[1], contract: entity[0], chainId };
    return createSecurityResult(security, TokenSecurityMessages, (info) => info.trust_list === '1');
}
