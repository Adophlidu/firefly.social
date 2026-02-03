'use client';

import { useEffect } from 'react';

import { ErrorHandler } from '@/components/ErrorHandler.js';
import { sentryClient } from '@/configs/sentryClient.js';
import { IS_PRODUCTION } from '@/constants/static.js';
import { ExceptionId } from '@/providers/types/Telemetry.js';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => {
        sentryClient.captureException(ExceptionId.UI_CRASH, error, {
            route: '/following/prediction',
        });
    }, [error]);

    const message = error?.message || String(error);

    return (
        <div className="flex min-h-screen flex-col">
            <ErrorHandler error={error} reset={reset} className="h-auto min-h-screen" />
            {!IS_PRODUCTION ? (
                <pre className="mx-4 mb-6 whitespace-pre-wrap break-words rounded-xl border border-line bg-lightBg p-4 text-xs text-second">
                    {message}
                    {error?.stack ? `\n\n${error.stack}` : ''}
                </pre>
            ) : null}
        </div>
    );
}
