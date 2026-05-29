import { bom } from '@dimensiondev/utils';

import { EVENT_MODAL } from '@/constants/event.js';

export interface ModalEvents {
    'compose-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'login-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'wallet-connect-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
}

export function dispatchModalEvent<K extends keyof ModalEvents>(
    name: K,
    action: 'open' | 'close',
    payload: unknown,
    init?: Omit<CustomEventInit, 'detail'>,
): void {
    bom.document?.dispatchEvent(
        new CustomEvent(`${EVENT_MODAL}:${name}`, {
            detail: {
                name,
                action,
                props: payload,
            },
            ...init,
        }),
    );
}
