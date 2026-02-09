'use client';

import { useReportErrorOnce } from '@/hooks/useReportErrorOnce.js';

/**
 * Root-level error boundary. Replaces the root layout when triggered.
 * Reports all errors to firefly-exception-tracker.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useReportErrorOnce(error, {
        tags: {
            handler: 'global-error',
            digest: error?.digest ?? 'none',
        },
    });

    return (
        <html lang="en">
            <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
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
                        background: '#fff',
                    }}
                >
                    Try again
                </button>
            </body>
        </html>
    );
}
