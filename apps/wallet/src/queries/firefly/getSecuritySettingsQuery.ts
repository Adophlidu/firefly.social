import { queryOptions } from '@tanstack/react-query';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getSecuritySettingsQuery() {
    return queryOptions({
        queryKey: ['security-settings'],
        queryFn: () => getFireflyEndpoint().getPinCodeStatus(),
    });
}
