/* cspell:disable */

import { captureClientException } from '@/providers/errorCapture/captureClientException.js';
import { ExceptionId } from '@/providers/errorCapture/captureException.js';
import { classifyError } from '@/providers/errorCapture/classifyError.js';

let initialized = false;

/**
 * Error message patterns to ignore (noise reduction)
 */
const IGNORED_ERROR_PATTERNS = [
    // Cross-origin script errors (no useful info)
    'Script error.',
    'Script error',

    // ResizeObserver warnings (benign, browser-specific)
    'ResizeObserver loop',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',

    // Google Analytics/Tag Manager errors
    'google-analytics',
    'googletagmanager',
    'gtag',
    'ga(',

    // Browser extensions
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://',

    // User-cancelled operations
    'AbortError',
    'The user aborted a request',

    // React development mode warnings
    'Warning: ',

    // Network errors during page unload
    'Failed to fetch',
];

/**
 * Checks if error message matches any ignored patterns
 */
function shouldIgnoreError(message: string): boolean {
    return IGNORED_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

/**
 * Resource types to monitor for load failures
 */
const MONITORED_RESOURCE_TAGS = ['IMG', 'SCRIPT', 'LINK', 'AUDIO', 'VIDEO', 'SOURCE'];

/**
 * Handles window.onerror - runtime JavaScript errors
 */
function handleWindowError(
    event: Event | string,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
): boolean {
    // Extract message from event
    const message = typeof event === 'string' ? event : (error?.message ?? 'Unknown error');

    if (shouldIgnoreError(message)) {
        return false;
    }

    // Create error if not provided
    const err = error ?? new Error(message);

    // Classify and capture
    const exceptionId = classifyError(err);
    captureClientException(err, {
        exceptionId,
        tags: {
            source: source ?? 'unknown',
            lineno: lineno ?? 0,
            colno: colno ?? 0,
            handler: 'window.onerror',
        },
    });

    // Don't prevent default error handling
    return false;
}

/**
 * Handles unhandledrejection - unhandled Promise rejections
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason;

    // Extract error/message from rejection reason
    let error: Error;
    let message: string;

    if (reason instanceof Error) {
        error = reason;
        message = reason.message;
    } else if (typeof reason === 'string') {
        error = new Error(reason);
        message = reason;
    } else {
        error = new Error(String(reason));
        message = String(reason);
    }

    if (shouldIgnoreError(message)) {
        return;
    }

    const exceptionId = classifyError(error, ExceptionId.UNHANDLED_REJECTION);

    captureClientException(error, {
        exceptionId,
        tags: {
            handler: 'unhandledrejection',
        },
    });
}

/**
 * Handles resource loading errors (images, scripts, stylesheets, etc.)
 * Uses capture phase to catch errors before they bubble
 */
function handleResourceError(event: Event): void {
    const target = event.target as HTMLElement | null;

    if (!target || !('tagName' in target)) {
        return;
    }

    const tagName = target.tagName;

    // Only monitor specific resource types
    if (!MONITORED_RESOURCE_TAGS.includes(tagName)) {
        return;
    }

    // Get the failed resource URL
    const src =
        (target as HTMLImageElement).src ||
        (target as HTMLScriptElement).src ||
        (target as HTMLLinkElement).href ||
        'unknown';

    // Skip data URLs and blobs
    if (src.startsWith('data:') || src.startsWith('blob:')) {
        return;
    }

    // Skip if URL is from ignored sources (extensions, analytics)
    if (shouldIgnoreError(src)) {
        return;
    }

    const error = new Error(`Failed to load ${tagName.toLowerCase()}: ${src}`);

    captureClientException(error, {
        exceptionId: ExceptionId.RESOURCE_LOAD_ERROR,
        tags: {
            resourceType: tagName.toLowerCase(),
            resourceUrl: src.substring(0, 500), // Truncate long URLs
            handler: 'resource.error',
        },
    });
}

/**
 * Initializes global error handlers for comprehensive client-side error capturing.
 * Safe to call multiple times - will only initialize once.
 */
export function initGlobalErrorHandlers(): void {
    if (initialized) {
        return;
    }

    if (typeof window === 'undefined') {
        return;
    }

    // Runtime JavaScript errors
    window.onerror = handleWindowError;

    // Unhandled Promise rejections
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Resource loading errors (capture phase to catch before bubble)
    window.addEventListener('error', handleResourceError, true);

    initialized = true;
}
