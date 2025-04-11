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
}
type Props = {
    ref: React.Ref<SingletonModalRefCreator<WalletConnectModalOpenProps | void>>;
};

export function WalletConnectModalRoot({ ref }: Props) {
    const isDark = useIsDarkMode();
    const { setThemeMode } = useAppKitTheme();
    const { setNetworkType, unsetNetworkType, setOrigin } = WalletConnectContext.useContainer();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setNetworkType(props?.networkType ? props.networkType : undefined);
            setOrigin(props?.origin ?? ClickOrigin.Others);
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
            <div>
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
