/**
 * Core features
 */
export { captureException, ExceptionId } from '@/core/captureException.js';
export { initGlobalErrorHandlers } from '@/core/globalHandlers.js';
export { reportException } from '@/core/reportException.js';
export { reportExceptionServer } from '@/core/reportExceptionServer.js';

/**
 * Helpers
 */
export { classifyError } from '@/helpers/classifyError.js';
export { getErrorMessage } from '@/helpers/getErrorMessage.js';
export { normalizeError } from '@/helpers/normalizeError.js';

/**
 * Configuration
 */
export {
    type ClientReportConfig,
    configureExceptionTracker,
    type ExceptionTrackerConfig,
    getExceptionTrackerConfig,
    type ServerReportConfig,
    type UserContext,
} from '@/config.js';

/**
 * Types
 */
export type { ExceptionPayload, ExceptionServerPayload, ExceptionTags } from '@/types.js';
