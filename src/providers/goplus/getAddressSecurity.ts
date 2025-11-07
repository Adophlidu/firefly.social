import { isEmpty } from 'lodash-es';
import urlcat from 'urlcat';

import { GO_PLUS_LABS_ROOT_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createSecurityResult } from '@/providers/goplus/createSecurityResult.js';
import { AddressSecurityMessages } from '@/providers/goplus/rules.js';
import type { AddressSecurity, GoPlusResponse } from '@/providers/types/Security.js';

export async function getAddressSecurity(address: string, chainId?: number) {
    const url = urlcat(GO_PLUS_LABS_ROOT_URL, 'api/v1/address_security/:address', {
        address: address.toLowerCase(),
        chain_id: chainId,
    });

    const res = await fetchJson<GoPlusResponse<AddressSecurity>>(url);
    if (isEmpty(res.result)) return;

    const security = { ...res.result, address, chainId };
    return createSecurityResult(security, AddressSecurityMessages);
}
