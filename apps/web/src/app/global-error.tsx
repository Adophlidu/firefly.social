'use client';

import { ExceptionId } from '@dimensiondev/exception-tracker';
import { useReportErrorOnce } from '@dimensiondev/exception-tracker/client';

/**
 * Root-level error boundary. Replaces the root layout when triggered.
 * Reports all errors to firefly-exception-tracker.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useReportErrorOnce(error, {
        exceptionId: ExceptionId.UI_CRASH,
        tags: {
            handler: 'global-error.tsx',
            digest: error?.digest ?? 'none',
        },
    });

    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    fontFamily: 'system-ui, sans-serif',
                    padding: '2rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: '1rem',
                }}
            >
                <h2>Something went wrong</h2>
                <p>We&apos;ve been notified and are looking into it.</p>
                <button
                    type="button"
                    onClick={() => reset()}
                    style={{
                        padding: '0.5rem 1rem',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        borderRadius: '0.5rem',
                        border: '1px solid #ccc',
                        color: '#000',
                        background: '#fff',
                    }}
                >
                    Try again
                </button>
            </body>
        </html>
    );
}
