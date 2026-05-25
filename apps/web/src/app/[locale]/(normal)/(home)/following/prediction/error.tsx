'use client';

import { IS_PRODUCTION } from '@dimensiondev/constants';
import { ExceptionId } from '@dimensiondev/exception-tracker';
import { useReportErrorOnce } from '@dimensiondev/exception-tracker/client';

import { ErrorHandler } from '@/components/ErrorHandler.js';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    useReportErrorOnce(error, {
        exceptionId: ExceptionId.UI_CRASH,
        tags: { handler: '/following/prediction/error.tsx' },
    });

    return (
        <div className="flex min-h-screen flex-col">
            <ErrorHandler error={error} reset={reset} className="h-auto min-h-screen" />
            {!IS_PRODUCTION ? (
                <pre className="mx-4 mb-6 whitespace-pre-wrap break-words rounded-xl border border-line bg-lightBg p-4 text-xs text-second">
                    {error?.message || String(error)}
                    {error?.stack ? `\n\n${error.stack}` : ''}
                </pre>
            ) : null}
        </div>
    );
}
