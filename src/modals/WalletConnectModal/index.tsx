import { delay } from '@masknet/kit';
import { useAppKitTheme } from '@reown/appkit/react';
import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';

import { Modal } from '@/components/Modal.js';
import { ClickOrigin, type NetworkType } from '@/constants/enum.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';

export interface WalletConnectModalOpenProps {
    origin?: ClickOrigin;
    networkType?: NetworkType;
    customTitle?: string;
}
export interface WalletConnectModalCloseProps {
    networkType: NetworkType;
}
type Props = {
    ref: React.Ref<SingletonModalRefCreator<WalletConnectModalOpenProps | void, WalletConnectModalCloseProps | void>>;
};

export function WalletConnectModalRoot({ ref }: Props) {
    const isDark = useIsDarkMode();
    const { setThemeMode } = useAppKitTheme();
    const { setNetworkType, unsetNetworkType, setOrigin, setCustomTitle } = WalletConnectContext.useContainer();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
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

    useEffect(() => {
        setThemeMode(isDark ? 'dark' : 'light');
    }, [isDark, setThemeMode]);

    return (
        <Modal open={open} onClose={() => dispatch?.close()}>
            <div className="max-md:h-[100vh] max-md:w-[100vw]">
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
