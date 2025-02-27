'use client';

import { delay } from '@masknet/kit';
import { captureMessage, captureUserFeedback } from '@sentry/browser';
import { useAsyncFn } from 'react-use';

import { env } from '@/constants/env.js';
import { useDeveloperSettingsState } from '@/store/useDeveloperSettingsStore.js';

export interface ErrorBoundaryError {
    /** Type of the Error */
    type: string;
    /** The Error message */
    message: string;
    /** The error stack */
    stack: string;
}

export interface CrashProps extends React.PropsWithChildren<ErrorBoundaryError> {
    /** Type of the Error */
    type: string;
    /** The Error message */
    message: string;
    /** The error stack */
    stack: string;
    onRetry: () => void;
}
export function CrashUI({ onRetry, ...error }: CrashProps) {
    // crash report, will send to GitHub
    const reportTitle = `[Crash] ${error.type}: ${error.message}`;
    const reportBody = `I was *doing something...*, then application reports an error.

> ${error.message}

Error stack:

<pre>${error.stack}</pre>

Version: ${env.shared.VERSION}
Commit Hash: ${env.shared.COMMIT_HASH}
Developer Settings: ${useDeveloperSettingsState.getState().developmentAPI}
`;

    const [{ loading }, onReport] = useAsyncFn(async () => {
        captureUserFeedback({
            name: reportTitle,
            comments: reportBody,
            event_id: captureMessage(reportTitle),
            email: 'report_to_sentry',
        });
        await delay(1000);
    }, [reportTitle, reportBody]);

    return (
        <div className="mt-4 w-full flex-1 overflow-x-auto p-5 contain-paint">
            <div className="rounded-md border border-red-500 p-5 text-red-500">
                <div>
                    <div className="mb-2 select-text">
                        {error.type}: {error.message}
                    </div>
                    <div className="flex gap-2">
                        <button className="rounded-md border border-blue-500 px-2 py-1 text-blue-500" onClick={onRetry}>
                            Try to recover
                        </button>
                        <button
                            className="rounded-md border border-blue-500 px-2 py-1 text-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={loading}
                            onClick={() => {
                                if (!loading) onReport();
                            }}
                        >
                            Report
                        </button>
                    </div>
                </div>
                <div className="mt-2 select-text overflow-x-auto">
                    <pre>
                        <code>{error.stack}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
}
