import { delay } from '@masknet/kit';
import { useAppKitTheme } from '@reown/appkit/react';
import { RouterProvider } from '@tanstack/react-router';
import { forwardRef, useEffect } from 'react';

import { Modal } from '@/components/Modal.js';
import type { NetworkType } from '@/constants/enum.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';

export interface WalletConnectModalOpenProps {
    networkType?: NetworkType;
}

export const WalletConnectModalRoot = forwardRef<SingletonModalRefCreator<WalletConnectModalOpenProps | void>>(
    function WalletConnectModalRoot(_, ref) {
        const isDark = useIsDarkMode();
        const { setThemeMode } = useAppKitTheme();
        const { updateNetworkType, reset } = WalletConnectContext.useContainer();

        const [open, dispatch] = useSingletonModal(ref, {
            onOpen: (props) => {
                updateNetworkType(props?.networkType ? props.networkType : undefined);
            },
            onClose: async () => {
                await delay(300);

                reset();
                walletRouter.navigate({ to: '/main', replace: true });
            },
        });

        useEffect(() => {
            setThemeMode(isDark ? 'dark' : 'light');
        }, [isDark, setThemeMode]);

        return (
            <Modal open={open} onClose={() => dispatch?.close()}>
                <div>
                    <RouterProvider router={walletRouter} />
                </div>
            </Modal>
        );
    },
);

export const WalletConnectModal = forwardRef<SingletonModalRefCreator<WalletConnectModalOpenProps | void>>(
    function WalletConnectModal(props, ref) {
        return (
            <WalletConnectContext.Provider>
                <WalletConnectModalRoot {...props} ref={ref} />
            </WalletConnectContext.Provider>
        );
    },
);
