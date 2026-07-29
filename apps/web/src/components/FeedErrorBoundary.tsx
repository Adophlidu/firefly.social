import { Trans } from '@lingui/react/macro';
import { Component, Fragment, type ReactNode } from 'react';

interface FeedErrorBoundaryProps {
    children?: ReactNode;
}

interface FeedErrorBoundaryState {
    error: Error | null;
    resetKey: number;
}

/**
 * Feed-level error boundary: an API failure in a suspense feed (infinite
 * query etc.) shows a retryable message in place of the feed instead of
 * crashing the whole page. Retrying remounts the feed, which makes
 * react-query refetch.
 */
export class FeedErrorBoundary extends Component<FeedErrorBoundaryProps, FeedErrorBoundaryState> {
    override state: FeedErrorBoundaryState = { error: null, resetKey: 0 };

    static getDerivedStateFromError(error: Error): Partial<FeedErrorBoundaryState> {
        return { error };
    }

    private readonly retry = () => {
        this.setState((previous) => ({ error: null, resetKey: previous.resetKey + 1 }));
    };

    override render(): ReactNode {
        if (this.state.error) {
            return (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-sm text-second">
                        <Trans>Failed to load. Please check your connection and try again.</Trans>
                    </p>
                    <button
                        type="button"
                        className="rounded-full bg-main px-5 py-1.5 text-sm font-bold text-primaryBottom hover:opacity-90"
                        onClick={this.retry}
                    >
                        <Trans>Retry</Trans>
                    </button>
                </div>
            );
        }
        return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;
    }
}
