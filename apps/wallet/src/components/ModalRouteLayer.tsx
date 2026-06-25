import { useLocation, useRouter } from '@tanstack/react-router';
import { lazy, Suspense, useState } from 'react';

import { ModalType } from '@/configs/modalRoutes.js';

const ReceiveModalWrapper = lazy(() =>
    import('@/components/ReceiveModal/ReceiveModalWrapper.js').then((m) => ({
        default: m.ReceiveModalWrapper,
    })),
);

const ExportKeyModalWrapper = lazy(() =>
    import('@/components/Bet/ExportKeyModalWrapper.js').then((m) => ({
        default: m.ExportKeyModalWrapper,
    })),
);

const DepositViaCryptoModalWrapper = lazy(() =>
    import('@/components/DepositViaCryptoModal/DepositViaCryptoModalWrapper.js').then((m) => ({
        default: m.DepositViaCryptoModalWrapper,
    })),
);

export function ModalRouteLayer() {
    const location = useLocation();
    const router = useRouter();
    const search = location.search as { modal?: string };
    const modalType = search?.modal;

    // To enable smooth closing
    const [closingModals, setClosingModals] = useState<string[]>([]);

    function handleClose(modalType: string, skipRedirect?: boolean) {
        if (!skipRedirect) {
            // Remove modal param while preserving other search params
            const currentSearch = { ...(location.search as Record<string, unknown>) };
            delete currentSearch.modal;
            const searchString = new URLSearchParams(
                Object.entries(currentSearch).reduce<Record<string, string>>((acc, [k, v]) => {
                    if (v !== undefined && v !== null) {
                        acc[k] = typeof v === 'object' ? JSON.stringify(v) : `${v as string | number | boolean}`;
                    }
                    return acc;
                }, {}),
            ).toString();
            const newPath = searchString ? `${location.pathname}?${searchString}` : location.pathname;
            setClosingModals((closingModals) => [...closingModals, modalType]);
            router.navigate({ to: newPath, replace: true });
        }
        setTimeout(() => {
            setClosingModals((closingModals) => closingModals.filter((m) => m !== modalType));
        }, 300);
    }

    if (modalType === ModalType.Receive || closingModals.includes(ModalType.Receive))
        return (
            <Suspense fallback={null}>
                <ReceiveModalWrapper
                    modalType={ModalType.Receive}
                    open={modalType === ModalType.Receive}
                    onClose={handleClose}
                />
            </Suspense>
        );

    if (modalType === ModalType.ExportBetKey || closingModals.includes(ModalType.ExportBetKey))
        return (
            <Suspense fallback={null}>
                <ExportKeyModalWrapper
                    modalType={ModalType.ExportBetKey}
                    open={modalType === ModalType.ExportBetKey}
                    onClose={handleClose}
                />
            </Suspense>
        );

    if (modalType === ModalType.DepositViaCrypto || closingModals.includes(ModalType.DepositViaCrypto))
        return (
            <Suspense fallback={null}>
                <DepositViaCryptoModalWrapper
                    modalType={ModalType.DepositViaCrypto}
                    open={modalType === ModalType.DepositViaCrypto}
                    onClose={handleClose}
                />
            </Suspense>
        );

    return null;
}
