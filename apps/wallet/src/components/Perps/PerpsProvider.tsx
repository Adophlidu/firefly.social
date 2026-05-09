import { type NavigateFunc, Provider, type ToastFn } from '@dimensiondev/rn-ui';
import { safeUnreachable } from '@dimensiondev/utils';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { type PropsWithChildren, useCallback } from 'react';
import { toast } from 'sonner';
import { useConnectors, useWalletClient } from 'wagmi';

import { useComeback } from '@/components/useComeback.js';
import { env } from '@/constants/env.js';
import { PRIVY_CONNECTOR_ID } from '@/constants/static.js';
import { logger } from '@/lib/Logger.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';

export function PerpsProvider({ children }: PropsWithChildren) {
    const token = useAtomValue(fireflySessionTokenAtom);
    const comeback = useComeback();
    const connectors = useConnectors();
    const navigate = useNavigate();
    const { data } = useWalletClient({
        connector: connectors.find((c) => c.id === PRIVY_CONNECTOR_ID),
    });

    const toastFn: ToastFn = useCallback(({ message, type, error }) => {
        switch (type) {
            case 'success':
                return toast.success(message);
            case 'error':
                if (error) {
                    logger.error('[Perps Error]: ', error);
                }
                return toast.error(message);
            case 'info':
                return toast.info(message);
            default:
                safeUnreachable(type);
                return toast(message);
        }
    }, []);
    const navigateFn: NavigateFunc = useCallback(
        (to, options) => {
            logger.info(`[Navigate]: to ${to} with options: `, options);

            switch (to) {
                case 'details': {
                    const token = 'coin' in options ? options?.coin : undefined;
                    return navigate({ to: `/perps/token?token=${token || ''}` });
                }
                case 'trade': {
                    const token = 'coin' in options ? options?.coin : undefined;
                    return navigate({ to: `/perps/?token=${token || ''}` });
                }
                case 'addFunds':
                    return navigate({ to: '/perps/deposit' });
                case 'withdraw':
                    return;
                case 'history':
                    return navigate({ to: '/perps/history' });
                case '__parent__':
                    comeback();
                    return;
                default:
                    safeUnreachable(to);
                    return;
            }
        },
        [navigate, comeback],
    );

    const isDevApi = env.external.NEXT_PUBLIC_FIREFLY_ROOT_URL.startsWith('https://api-dev.firefly.land');

    return (
        <Provider
            token={token}
            apiMode={isDevApi ? 'dev' : 'prod'}
            walletClient={data}
            toast={toastFn}
            navigate={navigateFn}
        >
            <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
        </Provider>
    );
}
