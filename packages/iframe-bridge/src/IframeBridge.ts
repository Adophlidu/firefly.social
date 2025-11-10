import { uniqueId } from 'lodash-es';

import { bom, timeout } from '@dimensiondev/utils';
import { getTargetWindow } from '@/getTargetWindow.js';
import {
    IframeBridgeMethod,
    type IframeBridgeMessage,
    type IframeBridgeRequestArguments,
    type IframeBridgeResponseResult,
} from '@/types.js';

const REQUEST_ONLY_METHODS = [
    IframeBridgeMethod.LOGIN,
    IframeBridgeMethod.COMPOSE,
    IframeBridgeMethod.ENQUEUE_MESSAGE,
    IframeBridgeMethod.NAVIGATE,
    IframeBridgeMethod.FIREFLY_WALLET_VISIBILITY,
];

interface Payload {
    result?: unknown;
    error?: string;
}

async function sendMessage<T extends IframeBridgeMethod>(
    method: T,
    id: string,
    params: IframeBridgeRequestArguments[T],
) {
    const targetWindow = await getTargetWindow();
    if (!targetWindow) {
        console.warn(`[iframe-bridge] Target window is not available for method: ${method}`);
        return;
    }

    const message: IframeBridgeMessage = {
        type: 'iframe-bridge-request',
        method,
        id,
        params,
    };
    targetWindow.postMessage(message, { targetOrigin: '*' });
}

export class IframeBridgeProvider {
    private callbacks = new Map<string, (payload: Payload) => void>();
    private messageListener?: (event: MessageEvent) => void;

    private installMessageListener() {
        if (!bom.window || this.messageListener) return;

        this.messageListener = (event: MessageEvent) => {
            // Only accept messages from same origin
            if (event.origin !== bom.window?.location.origin) return;

            const message = event.data as IframeBridgeMessage;
            if (!message || message.type !== 'iframe-bridge-response') return;

            const { id, payload } = message;
            if (this.callbacks.has(id) && payload) {
                this.callbacks.get(id)?.(payload);
            }
        };

        bom.window.addEventListener('message', this.messageListener);
    }

    private removeMessageListener() {
        if (!bom.window || !this.messageListener) return;

        bom.window.removeEventListener('message', this.messageListener);
        this.messageListener = undefined;
    }

    /**
     * Return true if iframe communication is supported.
     */
    get supported() {
        if (!bom.window) return false;
        return true;
    }

    /**
     * Send a request to the iframe or parent window.
     * @param method
     * @param params
     * @returns
     */
    async request<T extends IframeBridgeMethod>(method: T, params: IframeBridgeRequestArguments[T]) {
        const requestId = uniqueId('iframe-bridge');

        if (REQUEST_ONLY_METHODS.includes(method)) {
            await sendMessage(method, requestId, params);
            return Promise.resolve() as unknown as Promise<IframeBridgeResponseResult[T]>;
        }

        return timeout(
            new Promise<IframeBridgeResponseResult[T]>((resolve, reject) => {
                this.callbacks.set(requestId, (payload: Payload) => {
                    const { error, result } = payload;
                    if (error) reject(error);
                    else resolve(result as IframeBridgeResponseResult[T]);
                });

                // install the message listener
                this.installMessageListener();

                // dispatch the request
                sendMessage(method, requestId, params as IframeBridgeRequestArguments[T]).catch(reject);
            }),
            3 * 60 * 1000 /* 3 minute */,
            `[iframe-bridge] request ${method} timeout.`,
        ).finally(() => {
            this.callbacks.delete(requestId);
        });
    }

    /**
     * Handle incoming requests from iframe or parent window.
     * This method should be called to set up the request handler.
     * @param handler Function to handle incoming requests
     */
    onRequest(
        handler: <T extends IframeBridgeMethod>(
            method: T,
            params: IframeBridgeRequestArguments[T],
        ) => Promise<IframeBridgeResponseResult[T]> | IframeBridgeResponseResult[T],
    ) {
        if (!bom.window) return () => {};

        const messageListener = (event: MessageEvent) => {
            // Only accept messages from same origin
            if (event.origin !== bom.window?.location.origin) return;

            const message = event.data as IframeBridgeMessage;
            if (!message || message.type !== 'iframe-bridge-request') return;

            const { method, params, id } = message;

            // Handle the request
            Promise.resolve(handler(method, params as IframeBridgeRequestArguments[typeof method]))
                .then((result) => {
                    const response: IframeBridgeMessage = {
                        type: 'iframe-bridge-response',
                        method,
                        id,
                        payload: { result },
                    };
                    event.source?.postMessage(response, { targetOrigin: '*' });
                })
                .catch((error) => {
                    const response: IframeBridgeMessage = {
                        type: 'iframe-bridge-response',
                        method,
                        id,
                        payload: { error: error instanceof Error ? error.message : String(error) },
                    };
                    event.source?.postMessage(response, { targetOrigin: '*' });
                });
        };

        bom.window.addEventListener('message', messageListener);

        return () => {
            bom.window?.removeEventListener('message', messageListener);
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.removeMessageListener();
        this.callbacks.clear();
    }
}

export const iframeBridgeProvider = new IframeBridgeProvider();
