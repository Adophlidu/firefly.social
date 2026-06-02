'use client';

import { captureException, ExceptionId } from '@dimensiondev/exception-tracker';
import { Component, type ErrorInfo } from 'react';

import { type CrashProps, CrashUI, type ErrorBoundaryError } from '@/components/ErrorBoundary/Crash.js';
import { FireflyUnauthorizedError } from '@/constants/error.js';

interface ErrorBoundaryProps extends Partial<CrashProps> {
    /** Disable automatic error reporting */
    disableAutoReport?: boolean;
}

interface ErrorBoundaryState {
    error: Error | null;
    reported: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    static getDerivedStateFromError(error: unknown) {
        return { error, reported: false };
    }

    override state: ErrorBoundaryState = { error: null, reported: false };

    override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Unauthorized errors are escalated to global-error.tsx (see render), which
        // owns reporting + the signed-out screen. Don't report or render here.
        if (error instanceof FireflyUnauthorizedError) {
            return;
        }

        // Skip if auto-reporting is disabled or already reported
        if (this.props.disableAutoReport || this.state.reported) {
            return;
        }

        // Mark as reported to prevent duplicates
        this.setState({ reported: true });

        // Report the error with component stack information
        captureException(ExceptionId.UI_CRASH, error, {
            handler: 'ErrorBoundary.tsx',
            componentStack: errorInfo.componentStack?.substring(0, 1000) ?? 'unavailable',
        });
    }

    override render() {
        if (!this.state.error) return <>{this.props.children}</>;
        // Re-throw unauthorized errors so they bubble past this boundary to
        // app/global-error.tsx, which renders the signed-out screen. Without this
        // they'd be swallowed here as a generic crash card.
        if (this.state.error instanceof FireflyUnauthorizedError) throw this.state.error;
        return (
            <CrashUI
                onRetry={() => this.setState({ error: null, reported: false })}
                {...this.props}
                {...this.normalizedError}
            />
        );
    }

    private get normalizedError(): ErrorBoundaryError {
        let stack = '<stack not available>';
        let type = 'UnknownError';
        let message = 'unknown error';
        if (!this.state.error) return { stack, type, message };

        try {
            stack = String(this.state.error.stack!) || '<stack not available>';
        } catch {}

        try {
            type = String(this.state.error.name) || '<type not available>';
        } catch {}

        try {
            message = String(this.state.error.message) || '<message not available>';
        } catch {}

        return { stack, type, message };
    }
}
