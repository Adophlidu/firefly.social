import { env } from '@/constants/env.js';
import { IS_PREVIEW, IS_PRODUCTION } from '@/constants/static.js';
import { logger } from '@/libs/Logger.js';
import { type ExceptionId } from '@/providers/types/Telemetry.js';
import { settings } from '@/settings/index.js';

class SentryClient {
    private sentry: typeof import('@sentry/browser') | null = null;

    private async loadSentry() {
        if (!this.sentry) {
            this.sentry = await import('@sentry/browser');
        }
        return this.sentry;
    }

    async init() {
        if (this.sentry) return;

        const tags: Record<string, string> = {
            version: env.shared.VERSION,
            commitHash: env.shared.COMMIT_HASH ?? 'unknown',
            rootURL: settings.FIREFLY_ROOT_URL,
        };

        const sentry = await this.loadSentry();

        sentry.onLoad(() => {
            sentry.init({
                dsn: env.external.NEXT_PUBLIC_SENTRY_DSN,
                release: process.version,
                environment: IS_PRODUCTION ? 'prod' : IS_PREVIEW ? 'preview' : 'development',
                ignoreErrors: ['AbortError', 'The element has no supported sources.'],
            });

            Object.entries(tags).forEach(([key, value]) => {
                sentry.setTag(key, value);
            });

            logger.info(`[sentry] Initialized with DSN: ${env.external.NEXT_PUBLIC_SENTRY_DSN}`);
        });
    }

    async captureException(exceptionId: ExceptionId, error: unknown, tags?: Record<string, string | number>) {
        try {
            const sentry = await this.loadSentry();
            sentry.captureException(error, {
                level: 'error',
                tags: {
                    exceptionId,
                    ...tags,
                },
            });
        } catch {
            logger.warn(`[sentry] failed to capture exception: ${exceptionId}`, error);
        }
    }
}

export const sentryClient = new SentryClient();
