import type { ResolvedConfig } from '#/config.js';
import type { Logger } from '#/logger.js';

/**
 * Per-client runtime context threaded through the session classes and internal
 * helpers, so nothing depends on module-global state.
 */
export interface AuthContext {
    config: ResolvedConfig;
    logger: Logger;
}
