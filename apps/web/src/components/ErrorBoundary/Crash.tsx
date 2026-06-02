'use client';

import { envs } from '@dimensiondev/envs/web';

import { useCopyText } from '@/hooks/useCopyText.js';
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
    const developmentAPI = useDeveloperSettingsState.use.developmentAPI();
    const reportBody = `I was *doing something...*, then application reports an error.

> ${error.message}

Error stack:

<pre>${error.stack}</pre>

Version: ${envs.shared.VERSION}
Commit Hash: ${envs.shared.COMMIT_HASH}
Developer Settings: ${developmentAPI}
`;

    const [copied, handleCopy] = useCopyText(reportBody, { enqueueSuccessMessage: false });

    return (
        <div className="mt-4 w-full flex-1 overflow-x-auto p-2 contain-paint">
            <div className="rounded-md border border-red-500 p-2 text-red-500">
                <div>
                    <div className="mb-2 select-text">
                        {error.type}: {error.message}
                    </div>
                    <div className="mb-2 text-sm text-green-600">The error has been reported automatically.</div>
                    <div className="flex gap-2">
                        <button className="rounded-md border border-blue-500 px-2 py-1 text-blue-500" onClick={onRetry}>
                            Try to recover
                        </button>
                        <button
                            className="rounded-md border border-blue-500 px-2 py-1 text-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={copied ? undefined : () => handleCopy()}
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
                <div className="mt-2 select-text overflow-x-auto text-xs">
                    <pre>
                        <code>{error.stack}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
}
