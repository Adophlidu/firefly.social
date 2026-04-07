import { Fetch } from '@/lib/Fetch.js';

export interface Payload {
    method: string;
    params: unknown[];
    jsonrpc?: string;
    id?: number;
}

export interface Response<T> {
    result: T;
    id: number;
    jsonrpc: string;
    error?: {
        code: number;
        data: unknown;
        message: string;
    };
}

export class JsonRpcError extends Error {
    constructor(
        message: string,
        public readonly code: number,
        public readonly data?: unknown,
    ) {
        super(message);
    }
}

export class JsonRPC extends Fetch {
    constructor(baseURL: string) {
        super({
            baseURL,
        });
    }

    async request<R = unknown, P extends Payload = Payload>(payload: P): Promise<R> {
        const response = await this.post<Response<R>>('', {
            jsonrpc: '2.0',
            id: 1,
            ...payload,
        });
        if (response.status !== 200) {
            throw new JsonRpcError(`Error ${response.status}`, response.status);
        }
        if (response.data?.error) {
            throw new JsonRpcError(response.data.error.message, response.data.error.code, response.data.error.data);
        }
        return response.data.result;
    }

    static createProxy<T extends object>(baseURL: string): T {
        const provider = new JsonRPC(baseURL);
        return new Proxy(provider, {
            get(target, prop, receiver) {
                if (
                    typeof prop === 'string' &&
                    typeof (target as unknown as Record<string, unknown>)[prop] === 'function'
                ) {
                    return Reflect.get(target, prop, receiver);
                }
                if (typeof prop === 'string') {
                    return async (...params: unknown[]) => {
                        return provider.request({ method: prop, params });
                    };
                }
                return Reflect.get(target, prop, receiver);
            },
        }) as unknown as T;
    }
}
