import { captureException, ExceptionId } from '@dimensiondev/exception-tracker';
import type { ErrorPageProps } from '@dimensiondev/types';
import React, { type ReactNode } from 'react';

import { InvalidPolymarketAccountError } from '@/constants/error.js';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback: React.ComponentType<ErrorPageProps>;
    /** If provided, called instead of the default captureException. */
    catch?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    override state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    override componentDidCatch(error: Error, info: React.ErrorInfo) {
        if (!(error instanceof InvalidPolymarketAccountError)) {
            captureException(ExceptionId.UI_CRASH, error, {
                handler: 'ErrorBoundary',
            });
        }
        if (this.props.catch) {
            this.props.catch(error, info);
        }
    }

    resetError = () => {
        this.setState({ error: null });
    };

    override render() {
        const { error } = this.state;

        if (error) {
            const FallbackComponent = this.props.fallback;
            return <FallbackComponent error={error} reset={this.resetError} />;
        }

        return this.props.children;
    }
}
