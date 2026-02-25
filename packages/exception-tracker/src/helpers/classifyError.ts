import { ExceptionId } from '@/enums.js';

/**
 * Detects if error is a Next.js chunk loading failure
 */
function isChunkLoadError(error: Error | string): boolean {
    const message = typeof error === 'string' ? error : error.message;
    return (
        message.includes('Loading chunk') ||
        message.includes('ChunkLoadError') ||
        message.includes('Loading CSS chunk') ||
        message.includes('Failed to fetch dynamically imported module')
    );
}

/**
 * Detects if error is a network connectivity issue
 */
function isNetworkError(error: Error | string): boolean {
    const message = typeof error === 'string' ? error : error.message;
    return (
        message.includes('NetworkError') ||
        message.includes('Failed to fetch') ||
        message.includes('Network request failed') ||
        message.includes('net::ERR_') ||
        message.includes('Load failed')
    );
}

/**
 * Classifies an error and returns the appropriate ExceptionId.
 * @param defaultId - Fallback when error is neither chunk nor network (default: RUNTIME_ERROR)
 */
export function classifyError(error: Error, defaultId: ExceptionId = ExceptionId.RUNTIME_ERROR): ExceptionId {
    if (isChunkLoadError(error)) {
        return ExceptionId.CHUNK_LOAD_ERROR;
    }
    if (isNetworkError(error)) {
        return ExceptionId.NETWORK_ERROR;
    }
    return defaultId;
}
