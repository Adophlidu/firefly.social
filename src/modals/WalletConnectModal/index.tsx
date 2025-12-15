'use client';

import { delay } from '@dimensiondev/utils';
import { useAppKitTheme } from '@reown/appkit/react';
import { RouterProvider } from '@tanstack/react-router';

import { Modal } from '@/components/Modal.js';
import { ClickOrigin, type NetworkType } from '@/constants/enum.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';

export interface WalletConnectModalOpenProps {
    origin?: ClickOrigin;
    networkType?: NetworkType;
    customTitle?: string;
}

interface WalletConnectModalCloseProps {
    networkType: NetworkType;
}
interface Props {
    ref: React.Ref<SingletonModalRefCreator<WalletConnectModalOpenProps | void, WalletConnectModalCloseProps | void>>;
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

export const WalletConnectModalRef = new SingletonModal<
    WalletConnectModalOpenProps | void,
    WalletConnectModalCloseProps | void
>();
