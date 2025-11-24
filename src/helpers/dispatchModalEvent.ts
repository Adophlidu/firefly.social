/**
 * Type-safe modal event system for cross-component modal communication.
 *
 * @example
 * ```ts
 * type MyModalEvents = {
 *   'confirm-modal': {
 *     open: { title: string; content: string };
 *     close: boolean | null;
 *   };
 * };
 *
 * emitModalEvent<MyModalEvents>('confirm-modal', 'open', { title: 'Confirm', content: 'Are you sure?' });
 * ```
 */
import { MODAL_EVENT_NAME } from '@/constants/event.js';

interface ModalEvents {
    'compose-modal': {
        open?: unknown;
        close?: unknown;
        abort?: Error;
    };
}

export function dispatchModalEvent<K extends keyof ModalEvents>(
    name: K,
    action: 'open' | 'close' | 'abort',
    payload: unknown,
): void {
    document.dispatchEvent(
        new CustomEvent(`${MODAL_EVENT_NAME}:${name}`, {
            detail: {
                name,
                action,
                ...(action === 'abort' ? { error: payload as Error } : { props: payload }),
            },
            bubbles: true,
            cancelable: true,
        }),
    );
}
