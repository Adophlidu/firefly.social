import { noop } from 'lodash-es';

import type { RequestArguments } from '@/types/ethereum.js';

export function createEIP1193Provider(request: (requestArguments: RequestArguments) => Promise<unknown>) {
    return {
        async request<T>(parameters: unknown): Promise<T> {
            const label = Math.random().toString(36).substring(7);

            try {
                const requestArguments = parameters as RequestArguments;

                console.warn(`[eip1193 provider ${label}] request`, JSON.stringify(requestArguments));

                const result = await request(requestArguments);

                console.warn(`[eip1193 provider ${label}] result`, result);

                return result as T;
            } catch (error) {
                console.error(`[eip1193 provider ${label}] error`, JSON.stringify(error));
                throw error;
            }
        },
        on: noop,
        removeListener: noop,
    };
}
