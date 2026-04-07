import ComebackIcon from '@dimensiondev/assets/comeback2.svg';
import ErrorIcon from '@dimensiondev/assets/error-circle.svg';
import { Trans } from '@lingui/react/macro';
import { Navigate, useLocation, useNavigate } from '@tanstack/react-router';
import { useRef } from 'react';

import { ActionButton } from '@/components/ActionButton.js';
import { RoutePath, useSendToken } from '@/components/SendTransactionModal/types.js';
import { Button } from '@/components/ui/button.js';
import { useReportFeedback } from '@/hooks/useReportFeedback.js';

export function FailedView() {
    const navigate = useNavigate();
    const { token } = useSendToken();
    const location = useLocation();
    const state = location.state as unknown as { error: Error };

    // Capture error on mount so it survives route transition re-renders.
    const errorRef = useRef(state?.error);

    const [reported, loading, handleReport] = useReportFeedback(
        'Privy Transaction Failed',
        errorRef.current?.message ?? '',
    );

    if (!errorRef.current) {
        return <Navigate to={token ? RoutePath.Form : RoutePath.SelectToken} />;
    }

    return (
        <div className="flex w-full flex-1 flex-col px-6 pb-6">
            <div className="relative flex items-center justify-center py-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 [&_svg]:size-6"
                    onClick={() => navigate({ to: RoutePath.Form, replace: true })}
                >
                    <ComebackIcon />
                </Button>
                <h2 className="text-main text-lg font-semibold">
                    <Trans>Transaction failed</Trans>
                </h2>
            </div>
            <div className="my-auto flex size-full flex-col justify-between">
                <div className="flex flex-col items-center gap-4 pb-6">
                    <ErrorIcon width={64} height={64} />
                    <p className="text-main text-2xl font-semibold">
                        <Trans>Transaction failed</Trans>
                    </p>
                    <pre className="text-second max-h-[200px] w-full overflow-y-auto overflow-x-hidden text-center text-sm">
                        {errorRef.current.message}
                    </pre>
                </div>
                <div className="flex w-full items-center gap-2">
                    <ActionButton
                        variant="secondary"
                        className="bg-secondaryLine text-medium h-10 w-full rounded-lg border-none"
                        onClick={() => handleReport()}
                        disabled={reported}
                        loading={loading}
                    >
                        <Trans>Report issue</Trans>
                    </ActionButton>
                    <ActionButton
                        className="h-10 w-full rounded-lg"
                        onClick={() => navigate({ to: RoutePath.Form, replace: true })}
                    >
                        <span className="text-medium">
                            <Trans>Try again</Trans>
                        </span>
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}
