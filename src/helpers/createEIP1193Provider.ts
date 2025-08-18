import { noop } from 'lodash-es';

import type { RequestArguments } from '@/types/ethereum.js';

export function createEIP1193Provider(request: (requestArguments: RequestArguments) => Promise<unknown>) {
    return {
        async request<T>(parameters: unknown): Promise<T> {
            const label = crypto.randomUUID().substring(0, 7);

            try {
                const requestArguments = parameters as RequestArguments;

                console.log(`[eip1193 provider ${label}] request`, JSON.stringify(requestArguments));

                const result = await request(requestArguments);

                console.log(`[eip1193 provider ${label}] result`, result);

                return result as T;
            } catch (error) {
                console.error(`[eip1193 provider ${label}] error`, error);
                throw error;
            }
        },
        on: noop,
        removeListener: noop,
    };
}
