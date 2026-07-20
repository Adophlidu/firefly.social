import { Component } from 'react';
import type { ComponentType, ReactNode } from 'react';

interface ErrorBoundaryProps {
    Fallback: ComponentType<{ error: Error }>;
    children?: ReactNode;
}

interface ErrorBoundaryState {
    error: Error | null;
}

/**
 * React error boundary used to implement route-level `errorComponent`s.
 * Effective on the client only — React SSR does not catch render errors in
 * boundaries; the server handles loader/render failures separately.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    override state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    override render(): ReactNode {
        if (this.state.error) {
            return <this.props.Fallback error={this.state.error} />;
        }
        return this.props.children;
    }
}
