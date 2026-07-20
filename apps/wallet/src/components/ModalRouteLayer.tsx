import { useRouterState } from '@dimensiondev/ssr';
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
    const { pathname, search, navigate } = useRouterState();
    const modalType = search.get('modal') ?? undefined;

    // To enable smooth closing
    const [closingModals, setClosingModals] = useState<string[]>([]);

    function handleClose(modalType: string, skipRedirect?: boolean) {
        if (!skipRedirect) {
            // Remove modal param while preserving other search params
            const params = new URLSearchParams(search);
            params.delete('modal');
            const query = params.toString();
            const newPath = query ? `${pathname}?${query}` : pathname;
            setClosingModals((closingModals) => [...closingModals, modalType]);
            navigate?.(newPath, { replace: true });
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
