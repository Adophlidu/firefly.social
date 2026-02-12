'use client';

import { ErrorHandler } from '@/components/ErrorHandler.js';
import { IS_PRODUCTION } from '@/constants/static.js';
import { useReportErrorOnce } from '@/hooks/useReportErrorOnce.js';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    useReportErrorOnce(error, {
        tags: { route: '/following/prediction' },
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
