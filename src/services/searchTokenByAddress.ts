/* cspell:disable */

import { memoizePromise } from '@/helpers/memoizePromise.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export const searchTokenByAddress = memoizePromise(
    async function searchTokenByAddress(address: string) {
        const detected = await FireflyEndpointProvider.detectAddress(address);
        return detected?.list.find((x) => x.address_type === 'contract')?.contract_info;
    },
    (address) => address,
);
