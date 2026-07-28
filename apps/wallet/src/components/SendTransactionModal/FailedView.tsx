import ErrorIcon from '@dimensiondev/assets/error-circle.svg';
import { captureException, ExceptionId } from '@dimensiondev/exception-tracker';
import { useNavigate, useRouterState } from '@dimensiondev/ssr';
import { Trans } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { toast } from 'sonner';

import { ActionButton } from '@/components/ActionButton.js';
import { Navigate } from '@/components/Navigate.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import { RoutePath, useSendToken } from '@/components/SendTransactionModal/types.js';
import { getNavigationState } from '@/helpers/navigationState.js';

export function FailedView() {
    const [reported, setReported] = useState(false);

    const navigate = useNavigate();
    const { token } = useSendToken();
    const { pathname } = useRouterState();
    const state = getNavigationState<{ error: Error }>(pathname);

    // Capture error on mount so it survives route transition re-renders.
    const errorRef = useRef(state?.error);

    const [{ loading }, handleReport] = useAsyncFn(async () => {
        if (!errorRef.current) return;

        captureException(ExceptionId.CUSTOM_ERROR, errorRef.current, {
            handler: 'SendTransactionModal - FailedView',
        });
        setReported(true);

        toast.success(<Trans>Issue reported.</Trans>);
    }, []);

    if (!errorRef.current) {
        return <Navigate to={token ? RoutePath.Form : RoutePath.SelectToken} />;
    }

    return (
        <div className="flex w-full flex-1 flex-col pb-4">
            <NavigationBar onBack={() => navigate(RoutePath.Form, { replace: true })}>
                <Trans>Transaction failed</Trans>
            </NavigationBar>
            <div className="my-auto flex size-full flex-col justify-between px-4">
                <div className="flex flex-col items-center gap-4 pb-6">
                    <ErrorIcon width={64} height={64} />
                    <p className="text-2xl font-semibold text-main">
                        <Trans>Transaction failed</Trans>
                    </p>
                    <pre className="max-h-[200px] w-full overflow-y-auto overflow-x-hidden text-center text-sm text-second">
                        {errorRef.current.message}
                    </pre>
                </div>
                <div className="flex w-full items-center gap-2">
                    <ActionButton
                        variant="secondary"
                        className="h-10 w-full rounded-lg border-none bg-secondaryLine text-medium"
                        onClick={() => handleReport()}
                        disabled={reported}
                        loading={loading}
                    >
                        <Trans>Report issue</Trans>
                    </ActionButton>
                    <ActionButton
                        className="h-10 w-full rounded-lg"
                        onClick={() => navigate(RoutePath.Form, { replace: true })}
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
