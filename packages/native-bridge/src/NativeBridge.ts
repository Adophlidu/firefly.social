import { bom, parseJson, timeout } from '@dimensiondev/utils';
import { uniqueId } from 'lodash-es';

import {
    type EventPayload,
    type RequestArguments,
    type ResponseResult,
    type SupportedEvent,
    SupportedMethod,
} from '@/types';

const REQUEST_ONLY_METHODS = [
    SupportedMethod.SHARE,
    SupportedMethod.COMPOSE,
    SupportedMethod.BACK,
    SupportedMethod.UPDATE_NAVIGATOR_BAR,
    SupportedMethod.OPEN_URL,
    SupportedMethod.ADD_CALENDAR,
    SupportedMethod.CLOSE,
    SupportedMethod.SET_PRIMARY_BUTTON,
    SupportedMethod.SET_FRAME_READY_OPTIONS,
    SupportedMethod.FUND_PRIVY_ACCOUNT,
];

interface Payload {
    result?: unknown;
    error?: string;
}

function callNativeMethod<T extends SupportedMethod>(method: T, id: string, params: RequestArguments[T]) {
    // android
    if (bom.window?.FireflyApi) {
        bom.window.FireflyApi.callNativeMethod(method, id, JSON.stringify(params));
        return;
    }

    // ios
    if (bom.window?.webkit?.messageHandlers?.callNativeMethod) {
        bom.window.webkit.messageHandlers.callNativeMethod.postMessage({
            method,
            tag: id,
            params: JSON.stringify(params),
        });
        return;
    }

    throw new Error(`Failed to call native method: ${method} ${JSON.stringify(params)}`);
}

export class NativeBridgeProvider {
    private callbacks = new Map<string, (payload: Payload) => void>();
    private events = new Map<string, Set<(payload: Payload) => void>>();

    constructor() {
        if (!bom.window) return;

        Reflect.set(
            bom.window,
            'callJsMethod',
            <T extends SupportedMethod | SupportedEvent>(eventOrMethod: T, id: string, payload: string) => {
                const parsed = parseJson<Payload>(payload);
                if (!parsed) throw new Error(`[bridge] failed to parse response: ${payload}`);

                if (this.callbacks.has(id)) {
                    this.callbacks.get(id)?.(parsed);
                } else {
                    this.events.get(eventOrMethod)?.forEach((listener) => listener(parsed));
                }
            },
        );
    }

    /**
     * Return true if the application is opened in a native environment.
     */
    get supported() {
        if (typeof bom.window?.FireflyApi?.callNativeMethod === 'function') return true;
        if (typeof bom.window?.webkit?.messageHandlers?.callNativeMethod?.postMessage === 'function') return true;
        return false;
    }

    /**
     * Send a request to the native app.
     * @param method
     * @param params
     * @returns
     */
    request<T extends SupportedMethod>(method: T, params: RequestArguments[T]) {
        const requestId = uniqueId('bridge');

        if (REQUEST_ONLY_METHODS.includes(method)) {
            callNativeMethod(method, requestId, params);
            return Promise.resolve() as unknown as Promise<ResponseResult[T]>;
        }

        return timeout(
            new Promise<ResponseResult[T]>((resolve, reject) => {
                this.callbacks.set(requestId, (payload: Payload) => {
                    const { error, result } = payload;
                    if (error) reject(error);
                    else resolve(result as ResponseResult[T]);
                });

                // dispatch the request to the native app
                callNativeMethod(method, requestId, params as RequestArguments[T]);
            }),
            3 * 60 * 1000 /* 3 minute */,
            `[bridge] request ${method} timeout.`,
        ).finally(() => {
            this.callbacks.delete(requestId);
        });
    }

    on<T extends SupportedEvent>(event: T, listener: (payload: EventPayload[T]) => void) {
        type Listener = (payload: Payload) => void;
        const listeners = this.events.get(event) ?? new Set();
        listeners.add(listener as Listener);

        this.events.set(event, listeners);

        return () => {
            listeners.delete(listener as Listener);
        };
    }
}

export const nativeBridgeProvider = new NativeBridgeProvider();
