import { bom } from '@dimensiondev/utils';

import { EVENT_MODAL } from '@/constants/event.js';
import { activateAppModals } from '@/controllers/activateAppModals.js';
import { activateWalletStack } from '@/controllers/activateWalletStack.js';
import { logger } from '@/libs/Logger.js';

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
    snackbar: {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'tips-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'schedule-post-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'my-wallets-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'logout-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'edit-cross-at-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'disconnect-firefly-account-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'create-firefly-account-guide-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'add-lens-manager-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'draggable-popover': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'verified-address-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'token-selector-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'signup-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'sign-in-to-firefly-app-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'share-image-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'recovery-phrase-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'edit-profile-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'confirm-sync-session-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'collect-post-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'add-wallet-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
    'add-custom-erc20-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
}

/**
 * Modals living in the deferred `WalletModals` cluster (mounted once the wallet
 * stack is active).
 */
const WALLET_STACK_MODALS: ReadonlySet<keyof ModalEvents> = new Set<keyof ModalEvents>([
    'wallet-connect-modal',
    'my-wallets-modal',
]);

/**
 * Modals living in the deferred `AppModals` cluster (mounted on first open).
 * Keep in sync with `modals/AppModals.tsx`.
 */
const APP_MODALS: ReadonlySet<keyof ModalEvents> = new Set<keyof ModalEvents>([
    'add-custom-erc20-modal',
    'add-wallet-modal',
    'collect-post-modal',
    'compose-modal',
    'confirm-leaving-modal',
    'create-firefly-account-guide-modal',
    'edit-cross-at-modal',
    'edit-firefly-profile-modal',
    'edit-profile-modal',
    'frame-viewer-modal',
    'preview-media-modal',
    'recovery-phrase-modal',
    'red-packet-modal',
    'schedule-post-modal',
    'share-image-modal',
    'tips-modal',
    'token-selector-modal',
    'verified-address-modal',
]);

/**
 * Wallet-flow modals: opening them means a wallet interaction is starting, so
 * warm the wallet stack in parallel (non-blocking) even when the modal itself
 * lives in a different (or an already mounted) cluster.
 */
const WALLET_FLOW_MODALS: ReadonlySet<keyof ModalEvents> = new Set<keyof ModalEvents>([
    'add-custom-erc20-modal',
    'add-wallet-modal',
    'collect-post-modal',
    'compose-modal',
    'frame-viewer-modal',
    'login-modal',
    'recovery-phrase-modal',
    'red-packet-modal',
    'tips-modal',
    'token-selector-modal',
    'verified-address-modal',
]);

interface ModalEventDetail {
    name: keyof ModalEvents;
    action: 'open' | 'close' | 'openAndWaitForClose';
    props: unknown;
    resolve?: (value: unknown) => void;
    reject?: (error: Error) => void;
}

/** @returns whether a mounted modal handled the event (see `useSingletonModal`). */
function dispatchModalCustomEvent(
    eventName: string,
    detail: ModalEventDetail,
    init?: Omit<CustomEventInit, 'detail'>,
): boolean {
    // `detail`/`cancelable` last so `init` can never disable handled-detection.
    const event = new CustomEvent(eventName, { ...init, detail, cancelable: true });
    bom.document?.dispatchEvent(event);
    return event.defaultPrevented;
}

const RETRY_INTERVAL = 50;
const RETRY_ATTEMPTS = 60;

function redispatchUntilHandled(eventName: string, detail: ModalEventDetail, attempts = RETRY_ATTEMPTS): void {
    if (dispatchModalCustomEvent(eventName, detail)) return;
    if (attempts <= 0) {
        logger.warn(`[dispatchModalEvent]: ${detail.name} never mounted; dropping the pending open.`);
        detail.reject?.(new Error(`Modal ${detail.name} never mounted.`));
        return;
    }
    setTimeout(() => redispatchUntilHandled(eventName, detail, attempts - 1), RETRY_INTERVAL);
}

/**
 * Ensure the deferred cluster hosting the modal is mounted; resolves once the
 * activation preloads finish. Returns null when the modal is not deferred.
 */
function ensureModalHost(name: keyof ModalEvents): Promise<unknown> | null {
    const tasks: Array<Promise<void>> = [];
    if (APP_MODALS.has(name)) tasks.push(activateAppModals());
    if (WALLET_STACK_MODALS.has(name)) tasks.push(activateWalletStack());
    return tasks.length ? Promise.all(tasks) : null;
}

function dispatchOrActivate(
    name: keyof ModalEvents,
    detail: ModalEventDetail,
    init?: Omit<CustomEventInit, 'detail'>,
): void {
    // A wallet interaction is starting: warm the wallet stack without blocking
    // the modal open.
    if (WALLET_FLOW_MODALS.has(name)) void activateWalletStack();

    const eventName = `${EVENT_MODAL}:${name}`;
    if (dispatchModalCustomEvent(eventName, detail, init)) return;

    // Close/abort on an unmounted modal is a no-op by definition.
    if (detail.action !== 'open' && detail.action !== 'openAndWaitForClose') return;

    // The modal is in a deferred cluster that has not mounted yet: mount it,
    // then re-dispatch the open once the modal's event listener is attached.
    const pending = ensureModalHost(name);
    if (!pending) return;
    void pending.then(() => redispatchUntilHandled(eventName, detail));
}

export function dispatchModalEvent<K extends keyof ModalEvents>(
    name: K,
    action: 'open' | 'close',
    payload: unknown,
    init?: Omit<CustomEventInit, 'detail'>,
): void {
    dispatchOrActivate(name, { name, action, props: payload }, init);
}

export function openAndWaitForCloseModalEvent<K extends keyof ModalEvents>(
    name: K,
    payload?: unknown,
): Promise<unknown> {
    return new Promise((resolve, reject) => {
        dispatchOrActivate(name, {
            name,
            action: 'openAndWaitForClose',
            props: payload,
            resolve,
            reject,
        });
    });
}
