'use client';

import { WHITEBOARD_ROUTES } from '@dimensiondev/constants/static';
import { memo, type ReactNode } from 'react';

import { IfPathname } from '@/components/IfPathname.js';
import { NoSSR } from '@/components/NoSSR.js';
import { dynamic } from '@/esm/dynamic.js';
import { AddLensManagerModal } from '@/modals/AddLensManagerModal/AddLensManagerModal.js';
import { AddLensManagerModalRef } from '@/modals/AddLensManagerModal/refs.js';
import { ConfirmFireflyModal } from '@/modals/ConfirmFireflyModal/ConfirmFireflyModal.js';
import { ConfirmFireflyModalRef } from '@/modals/ConfirmFireflyModal/refs.js';
import { ConfirmModal } from '@/modals/ConfirmModal/ConfirmModal.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { ConfirmSyncSessionModal } from '@/modals/ConfirmSyncSessionModal/ConfirmSyncSessionModal.js';
import { ConfirmSyncSessionModalRef } from '@/modals/ConfirmSyncSessionModal/refs.js';
import { DisconnectFireflyAccountModal } from '@/modals/DisconnectFireflyAccountModal/DisconnectFireflyAccountModal.js';
import { DisconnectFireflyAccountModalRef } from '@/modals/DisconnectFireflyAccountModal/refs.js';
import { DownloadMobileAppModal } from '@/modals/DownloadMobileAppModal/DownloadMobileAppModal.js';
import { DownloadMobileAppModalRef } from '@/modals/DownloadMobileAppModal/refs.js';
import { DraggablePopover } from '@/modals/DraggablePopover/DraggablePopover.js';
import { DraggablePopoverRef } from '@/modals/DraggablePopover/refs.js';
import { ImageEditorModal } from '@/modals/ImageEditorModal/ImageEditorModal.js';
import { ImageEditorModalRef } from '@/modals/ImageEditorModal/refs.js';
import { LoginModal } from '@/modals/LoginModal/LoginModal.js';
import { LoginModalRef } from '@/modals/LoginModal/refs.js';
import { LogoutModal } from '@/modals/LogoutModal/LogoutModal.js';
import { LogoutModalRef } from '@/modals/LogoutModal/refs.js';
import { PasswordModal } from '@/modals/PasswordModal/PasswordModal.js';
import { PasswordModalRef } from '@/modals/PasswordModal/refs.js';
import { SignInToFireflyAppModalRef } from '@/modals/SignInToFireflyAppModal/refs.js';
import { SignInToFireflyAppModal } from '@/modals/SignInToFireflyAppModal/SignInToFireflyAppModal.js';
import { SignInWithFireflyAppModalRef } from '@/modals/SignInWithFireflyAppModal/refs.js';
import { SignInWithFireflyAppModal } from '@/modals/SignInWithFireflyAppModal/SignInWithFireflyAppModal.js';
import { SignupModalRef } from '@/modals/SignupModal/refs.js';
import { SignupModal } from '@/modals/SignupModal/SignupModal.js';
import { SnackbarRef } from '@/modals/Snackbar/refs.js';
import { Snackbar } from '@/modals/Snackbar/Snackbar.js';
import { useWalletStackStore } from '@/store/useWalletStackStore.js';

// Deferred cluster: heavy compose/tips/red-packet/collect modals kept out of the
// eager bundle; mounted on the first open of any of them (see
// `controllers/activateAppModals.ts`).
const AppModals = dynamic(() => import('@/modals/AppModals.js').then((m) => m.AppModals), { ssr: false });

// Deferred wallet modals (WalletConnect + MyWallets + AppKit init). Rendered
// only once the wallet stack is active.
const WalletModals = dynamic(() => import('@/modals/WalletModals.js').then((m) => m.WalletModals), { ssr: false });

// Deferred so it is not part of the eager modal barrel on whiteboard first paint.
const WagmiProvider = dynamic(() => import('@/components/WagmiProvider.js').then((m) => m.WagmiProvider), {
    ssr: false,
});

/**
 * Provides the wagmi context to the modals.
 *
 * On non-whiteboard routes the app-wide WagmiProvider (see `WalletStackBoundary`)
 * is already an ancestor, so this is a passthrough. On whiteboard routes there is
 * no app-wide provider, so once the wallet stack — or the AppModals cluster,
 * whose modals call wagmi hooks at their roots — is activated, this wraps the
 * modal tree (LoginModal's LensView, WalletConnectModal, TokenSelectorModal, …)
 * in its own provider.
 */
const ModalsWalletBoundary = memo(function ModalsWalletBoundary({
    withProvider,
    children,
}: {
    withProvider: boolean;
    children: ReactNode;
}) {
    return (
        <IfPathname
            isNotOneOf={WHITEBOARD_ROUTES}
            otherwise={withProvider ? <WagmiProvider>{children}</WagmiProvider> : <>{children}</>}
        >
            {children}
        </IfPathname>
    );
});

export const Modals = memo(function Modals() {
    const active = useWalletStackStore((state) => state.active);
    const appModalsActive = useWalletStackStore((state) => state.appModalsActive);

    return (
        <NoSSR>
            <ModalsWalletBoundary withProvider={active || appModalsActive}>
                {/* Shared Modals */}
                <DisconnectFireflyAccountModal ref={DisconnectFireflyAccountModalRef.register} />
                <DownloadMobileAppModal ref={DownloadMobileAppModalRef.register} />
                <LoginModal ref={LoginModalRef.register} />
                <LogoutModal ref={LogoutModalRef.register} />
                <SignInWithFireflyAppModal ref={SignInWithFireflyAppModalRef.register} />
                <SignInToFireflyAppModal ref={SignInToFireflyAppModalRef.register} />
                <Snackbar ref={SnackbarRef.register} />
                <ConfirmModal ref={ConfirmModalRef.register} />
                <SignupModal ref={SignupModalRef.register} />
                <ImageEditorModal ref={ImageEditorModalRef.register} />
                <ConfirmFireflyModal ref={ConfirmFireflyModalRef.register} />
                <PasswordModal ref={PasswordModalRef.register} />
                <ConfirmSyncSessionModal ref={ConfirmSyncSessionModalRef.register} />
                <AddLensManagerModal ref={AddLensManagerModalRef.register} />
                <DraggablePopover ref={DraggablePopoverRef.register} />

                {/* WalletConnect + MyWallets + AppKit init: only once the wallet
                    stack is active (boot session or first wallet interaction). */}
                {active ? <WalletModals /> : null}

                {/* Compose / tips / red packet / collect / ...: only once the first
                    open of any of them activates the cluster (see
                    `controllers/dispatchModalEvent.ts`, which re-dispatches the
                    pending open after the mount). */}
                {appModalsActive ? <AppModals /> : null}
            </ModalsWalletBoundary>
        </NoSSR>
    );
});
