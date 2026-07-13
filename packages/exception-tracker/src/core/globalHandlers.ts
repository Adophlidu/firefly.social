import type { IgnoredErrorPattern } from '@/config.js';
import { getExceptionTrackerConfig } from '@/config.js';
import { captureException, ExceptionId } from '@/core/captureException.js';
import { classifyError } from '@/helpers/classifyError.js';
import { getErrorMessage } from '@/helpers/getErrorMessage.js';
import { reloadOnceForChunkError } from '@/helpers/reloadOnChunkError.js';

let initialized = false;

/**
 * Built-in error message patterns to ignore (noise reduction)
 */
const DEFAULT_IGNORED_PATTERNS: IgnoredErrorPattern[] = [
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

    // Browser extensions / browser internals
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://',
    '__firefox__', // Brave/Firefox iOS browser-internal errors

    // User-cancelled operations
    'AbortError',
    'The user aborted a request',

    // React development mode warnings
    'Warning: ',

    // Network errors during page unload
    'Failed to fetch',

    // Expected business errors
    'TweetUnavailableError',
];

function getIgnoredPatterns(): IgnoredErrorPattern[] {
    const cfg = getExceptionTrackerConfig();
    const custom = cfg?.ignoredErrors ?? [];
    return [...DEFAULT_IGNORED_PATTERNS, ...custom];
}

/**
 * Checks if error message matches any ignored patterns.
 * Strings use substring match (includes); RegExp uses regex test.
 */
function shouldIgnoreError(message: string): boolean {
    const patterns = getIgnoredPatterns();
    return patterns.some((pattern) => {
        if (typeof pattern === 'string') {
            return message.includes(pattern);
        }
        return pattern.test(message);
    });
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
    captureException(exceptionId, err, {
        source: source ?? 'unknown',
        lineno: lineno ?? 0,
        colno: colno ?? 0,
        handler: 'window.onerror',
    });

    // Transient chunk-load failures (e.g. Google's renderer flaking on a lazy
    // JS chunk) would otherwise bubble to the crash boundary and get indexed as
    // a soft 404. Recover by reloading once per failure cycle.
    reloadOnceForChunkError(err);

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
        message = getErrorMessage(reason);
        error = new Error(message);
    }

    if (shouldIgnoreError(message)) {
        return;
    }

    const exceptionId = classifyError(error, ExceptionId.UNHANDLED_REJECTION);

    captureException(exceptionId, error, {
        handler: 'unhandledrejection',
    });

    // See handleWindowError: recover from a transient chunk-load failure once
    // before it can bubble to the crash boundary and be indexed as a soft 404.
    reloadOnceForChunkError(error);
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

    captureException(ExceptionId.RESOURCE_LOAD_ERROR, error, {
        resourceType: tagName.toLowerCase(),
        resourceUrl: src.substring(0, 500), // Truncate long URLs
        handler: 'resource.error',
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

    console.info(`[initGlobalErrorHandlers] init global error handlers`);

    // Runtime JavaScript errors
    window.onerror = handleWindowError;

    // Unhandled Promise rejections
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Resource loading errors (capture phase to catch before bubble) — opt out via configureExceptionTracker
    if (getExceptionTrackerConfig()?.reportResourceLoadErrors !== false) {
        window.addEventListener('error', handleResourceError, true);
    }

    initialized = true;
}
