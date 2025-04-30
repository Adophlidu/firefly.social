import {
    browserTracingIntegration,
    captureException,
    feedbackIntegration,
    init,
    onLoad,
    setTag,
} from '@sentry/browser';

import { env } from '@/constants/env.js';
import { IS_PREVIEW, IS_PRODUCTION } from '@/constants/index.js';
import type { ExceptionId } from '@/providers/types/Telemetry.js';
import { settings } from '@/settings/index.js';

class SentryClient {
    private initialized = false;

    init() {
        // make sure we only initialize once
        if (this.initialized) return;

        const tags: Record<string, string> = {
            version: env.shared.VERSION,
            commitHash: env.shared.COMMIT_HASH ?? 'unknown',
            rootURL: settings.FIREFLY_ROOT_URL,
        };

        onLoad(() => {
            const feedback = feedbackIntegration({
                id: 'sentry-feedback-integration',
                colorScheme: 'system',
                isNameRequired: false,
                isEmailRequired: false,
                autoInject: false,
                showBranding: false,
            });
            const browserTracking = browserTracingIntegration();

            init({
                dsn: env.external.NEXT_PUBLIC_SENTRY_DSN,

                release: process.version,
                environment: IS_PRODUCTION ? 'prod' : IS_PREVIEW ? 'preview' : 'development',
                integrations: [browserTracking, feedback],

                tracesSampleRate: 1.0,
                tracePropagationTargets: [/mask\.social/],

                replaysSessionSampleRate: 1.0,
                replaysOnErrorSampleRate: 1.0,

                ignoreErrors: ['AbortError'],
            });

            // set initial tags
            Object.entries(tags).forEach(([key, value]) => {
                setTag(key, value);
            });

            this.initialized = true;
            console.log(`[sentry] Initialized with DSN: ${env.external.NEXT_PUBLIC_SENTRY_DSN}`);
        });
    }

    captureException(exceptionId: ExceptionId, error: unknown, tags?: Record<string, string | number>) {
        try {
            captureException(error, {
                level: 'error',
                tags: {
                    exceptionId,
                    ...tags,
                },
            });
        } catch {
            console.warn(`[sentry] failed to capture exception: ${exceptionId}`, error);
        }
    }
}

export const sentryClient = new SentryClient();
