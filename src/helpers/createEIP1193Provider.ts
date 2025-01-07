import { noop } from 'lodash-es';

import type { RequestArguments } from '@/types/ethereum.js';

export function createEIP1193Provider(request: (requestArguments: RequestArguments) => Promise<unknown>) {
    return {
        async request<T>(parameters: unknown): Promise<T> {
            const result = await request(parameters as Parameters<typeof request>[0]);
            return result as T;
        },
        on: noop,
        removeListener: noop,
    };
}
