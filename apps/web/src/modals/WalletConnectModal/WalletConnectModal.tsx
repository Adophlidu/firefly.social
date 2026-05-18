'use client';

import { ClickOrigin } from '@dimensiondev/enums';
import { delay } from '@dimensiondev/utils';
import { useAppKitTheme } from '@reown/appkit/react';
import { RouterProvider } from '@tanstack/react-router';
import type { Ref } from 'react';

import { Modal } from '@/components/Modal.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import type { WalletConnectModalRefType } from '@/modals/WalletConnectModal/refs.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';

interface Props {
    ref: Ref<WalletConnectModalRefType>;
}

function WalletConnectModalRoot({ ref }: Props) {
    const isDark = useIsDarkMode();
    const { setThemeMode } = useAppKitTheme();
    const { setNetworkType, unsetNetworkType, setOrigin, setCustomTitle } = WalletConnectContext.useContainer();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setThemeMode(isDark ? 'dark' : 'light');
            setNetworkType(props?.networkType ? props.networkType : undefined);
            setOrigin(props?.origin ?? ClickOrigin.Others);
            setCustomTitle(props?.customTitle || null);
        },
        onClose: async () => {
            await delay(300);

            unsetNetworkType();
            walletRouter.navigate({ to: '/main', replace: true });
        },
    });

    return (
        <Modal open={open} onClose={() => dispatch?.close()}>
            <div className="max-md:h-screen max-md:w-screen">
                <RouterProvider router={walletRouter} />
            </div>
        </Modal>
    );
}

export function WalletConnectModal({ ref, ...props }: Props) {
    return (
        <WalletConnectContext.Provider>
            <WalletConnectModalRoot {...props} ref={ref} />
        </WalletConnectContext.Provider>
    );
}
