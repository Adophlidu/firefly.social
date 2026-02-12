'use client';

import { useEffectOnce } from 'react-use';

import { initGlobalErrorHandlers } from './globalHandlers.js';

/**
 * Installs global error handlers (window.onerror, unhandledrejection, resource errors).
 * Safe to call from multiple components - handlers are only initialized once.
 */
export function useInitGlobalErrorHandlers(): void {
    useEffectOnce(() => {
        initGlobalErrorHandlers();
    });
}
