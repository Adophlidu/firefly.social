'use client';

import { PageRoute } from '@dimensiondev/enums';
import { ExceptionId } from '@dimensiondev/exception-tracker';
import { useReportErrorOnce } from '@dimensiondev/exception-tracker/client';

import { FireflyUnauthorizedError } from '@/constants/error.js';

const buttonStyle = {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    cursor: 'pointer',
    borderRadius: '0.5rem',
    border: '1px solid #ccc',
    color: '#000',
    background: '#fff',
} as const;

const bodyStyle = {
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
} as const;

/**
 * Root-level error boundary. Replaces the root layout when triggered.
 * Reports all errors to firefly-exception-tracker.
 *
 * Strings here are intentionally hardcoded English: this boundary renders outside
 * the i18n providers, so <Trans>/t`` are unavailable (matches the generic copy below).
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    // Detect by name rather than instanceof: a duplicated module across the boundary
    // would break the prototype chain, but the name survives serialization.
    const isUnauthorized = error?.name === new FireflyUnauthorizedError().name;

    useReportErrorOnce(error, {
        exceptionId: ExceptionId.UI_CRASH,
        tags: {
            handler: 'global-error.tsx',
            digest: error?.digest ?? 'none',
            // Auth sign-outs aren't crashes; tag them so they're filterable.
            kind: isUnauthorized ? 'session-unauthorized' : 'crash',
        },
    });

    if (isUnauthorized) {
        return (
            <html lang="en">
                <body style={bodyStyle}>
                    <h2>You&apos;ve been signed out</h2>
                    <p>Your session has expired. Please sign in again to continue.</p>
                    <a href={PageRoute.Signup} style={{ ...buttonStyle, textDecoration: 'none' }}>
                        Go to login
                    </a>
                </body>
            </html>
        );
    }

    return (
        <html lang="en">
            <body style={bodyStyle}>
                <h2>Something went wrong</h2>
                <p>We&apos;ve been notified and are looking into it.</p>
                <button type="button" onClick={() => reset()} style={buttonStyle}>
                    Try again
                </button>
            </body>
        </html>
    );
}
