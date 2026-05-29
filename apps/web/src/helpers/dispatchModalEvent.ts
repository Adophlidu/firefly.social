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
    'preview-media-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'wallet-connect-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'confirm-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'confirm-leaving-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'password-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'image-editor-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'download-mobile-app-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'confirm-firefly-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'frame-viewer-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'edit-firefly-profile-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'sign-in-with-firefly-app-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'red-packet-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'draggable-popover': {
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

export function openAndWaitForCloseModalEvent<K extends keyof ModalEvents>(
    name: K,
    payload?: unknown,
): Promise<unknown> {
    return new Promise((resolve, reject) => {
        bom.document?.dispatchEvent(
            new CustomEvent(`${EVENT_MODAL}:${name}`, {
                detail: {
                    name,
                    action: 'openAndWaitForClose',
                    props: payload,
                    resolve,
                    reject,
                },
            }),
        );
    });
}
