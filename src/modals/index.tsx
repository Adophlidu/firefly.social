'use client';

import { memo } from 'react';

import { IfPathname } from '@/components/IfPathname.js';
import { NoSSR } from '@/components/NoSSR.js';
import { WHITEBOARD_ROUTES } from '@/constants/static.js';
import { AddCustomERC20Modal } from '@/modals/AddCustomERC20Modal/AddCustomERC20Modal.js';
import { AddCustomERC20ModalRef } from '@/modals/AddCustomERC20Modal/refs.js';
import { AddCustomERC721Modal } from '@/modals/AddCustomERC721Modal/AddCustomERC721Modal.js';
import { AddCustomERC721ModalRef } from '@/modals/AddCustomERC721Modal/refs.js';
import { AddLensManagerModal } from '@/modals/AddLensManagerModal/AddLensManagerModal.js';
import { AddLensManagerModalRef } from '@/modals/AddLensManagerModal/refs.js';
import { AddWalletModal } from '@/modals/AddWalletModal/AddWalletModal.js';
import { AddWalletModalRef } from '@/modals/AddWalletModal/refs.js';
import { CollectArticleModal } from '@/modals/CollectArticleModal/CollectArticleModal.js';
import { CollectArticleModalRef } from '@/modals/CollectArticleModal/refs.js';
import { CollectPostModal } from '@/modals/CollectPostModal/CollectPostModal.js';
import { CollectPostModalRef } from '@/modals/CollectPostModal/refs.js';
import { ComposeModal } from '@/modals/ComposeModal/ComposeModal.js';
import { ComposeModalRef } from '@/modals/ComposeModal/refs.js';
import { ConfirmFireflyModal } from '@/modals/ConfirmFireflyModal/ConfirmFireflyModal.js';
import { ConfirmFireflyModalRef } from '@/modals/ConfirmFireflyModal/refs.js';
import { ConfirmLeavingModal } from '@/modals/ConfirmLeavingModal/ConfirmLeavingModal.js';
import { ConfirmLeavingModalRef } from '@/modals/ConfirmLeavingModal/refs.js';
import { ConfirmModal } from '@/modals/ConfirmModal/ConfirmModal.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { ConfirmSyncSessionModal } from '@/modals/ConfirmSyncSessionModal/ConfirmSyncSessionModal.js';
import { ConfirmSyncSessionModalRef } from '@/modals/ConfirmSyncSessionModal/refs.js';
import { CreateFireflyAccountGuideModal } from '@/modals/CreateFireflyAccountGuideModal/CreateFireflyAccountGuideModal.js';
import { CreateFireflyAccountGuideModalRef } from '@/modals/CreateFireflyAccountGuideModal/refs.js';
import { DisconnectFireflyAccountModal } from '@/modals/DisconnectFireflyAccountModal/DisconnectFireflyAccountModal.js';
import { DisconnectFireflyAccountModalRef } from '@/modals/DisconnectFireflyAccountModal/refs.js';
import { DownloadMobileAppModal } from '@/modals/DownloadMobileAppModal/DownloadMobileAppModal.js';
import { DownloadMobileAppModalRef } from '@/modals/DownloadMobileAppModal/refs.js';
import { DraggablePopover } from '@/modals/DraggablePopover/DraggablePopover.js';
import { DraggablePopoverRef } from '@/modals/DraggablePopover/refs.js';
import { EditCrossAtModal } from '@/modals/EditCrossAtModal/EditCrossAtModal.js';
import { EditCrossAtModalRef } from '@/modals/EditCrossAtModal/refs.js';
import { EditFireflyProfileModal } from '@/modals/EditFireflyProfileModal/EditFireflyProfileModal.js';
import { EditFireflyProfileModalRef } from '@/modals/EditFireflyProfileModal/refs.js';
import { FrameViewerModal } from '@/modals/FrameViewerModal/FrameViewerModal.js';
import { FrameViewerModalRef } from '@/modals/FrameViewerModal/refs.js';
import { ImageEditorModal } from '@/modals/ImageEditorModal/ImageEditorModal.js';
import { ImageEditorModalRef } from '@/modals/ImageEditorModal/refs.js';
import { LoginModal } from '@/modals/LoginModal/LoginModal.js';
import { LoginModalRef } from '@/modals/LoginModal/refs.js';
import { LogoutModal } from '@/modals/LogoutModal/LogoutModal.js';
import { LogoutModalRef } from '@/modals/LogoutModal/refs.js';
import { MyWalletsModal } from '@/modals/MyWalletsModal/MyWalletsModal.js';
import { MyWalletsModalRef } from '@/modals/MyWalletsModal/refs.js';
import { NonFungibleCollectionSelectModal } from '@/modals/NonFungibleCollectionSelectModal/NonFungibleCollectionSelectModal.js';
import { NonFungibleTokenCollectionSelectModalRef } from '@/modals/NonFungibleCollectionSelectModal/refs.js';
import { PasswordModal } from '@/modals/PasswordModal/PasswordModal.js';
import { PasswordModalRef } from '@/modals/PasswordModal/refs.js';
import { PreviewMediaModal } from '@/modals/PreviewMediaModal/PreviewMediaModal.js';
import { PreviewMediaModalRef } from '@/modals/PreviewMediaModal/refs.js';
import { RecoveryPhraseModal } from '@/modals/RecoveryPhraseModal/RecoveryPhraseModal.js';
import { RecoveryPhraseModalRef } from '@/modals/RecoveryPhraseModal/refs.js';
import { RedPacketModal } from '@/modals/RedPacketModal/RedPacketModal.js';
import { RedPacketModalRef } from '@/modals/RedPacketModal/refs.js';
import { SchedulePostModalRef } from '@/modals/SchedulePostModal/refs.js';
import { SchedulePostModal } from '@/modals/SchedulePostModal/SchedulePostModal.js';
import { ShareImageModalRef } from '@/modals/ShareImageModal/refs.js';
import { ShareImageModal } from '@/modals/ShareImageModal/ShareImageModal.js';
import { SignInToFireflyAppModalRef } from '@/modals/SignInToFireflyAppModal/refs.js';
import { SignInToFireflyAppModal } from '@/modals/SignInToFireflyAppModal/SignInToFireflyAppModal.js';
import { SignInWithFireflyAppModalRef } from '@/modals/SignInWithFireflyAppModal/refs.js';
import { SignInWithFireflyAppModal } from '@/modals/SignInWithFireflyAppModal/SignInWithFireflyAppModal.js';
import { SignupModalRef } from '@/modals/SignupModal/refs.js';
import { SignupModal } from '@/modals/SignupModal/SignupModal.js';
import { SnackbarRef } from '@/modals/Snackbar/refs.js';
import { Snackbar } from '@/modals/Snackbar/Snackbar.js';
import { SwapModalRef } from '@/modals/SwapModal/refs.js';
import { SwapModal } from '@/modals/SwapModal/SwapModal.js';
import { TipsModalRef } from '@/modals/TipsModal/refs.js';
import { TipsModal } from '@/modals/TipsModal/TipsModal.js';
import { TokenSelectorModalRef } from '@/modals/TokenSelectorModal/refs.js';
import { TokenSelectorModal } from '@/modals/TokenSelectorModal/TokenSelectorModal.js';
import { VerifiedAddressModalRef } from '@/modals/VerifiedAddressModal/refs.js';
import { VerifiedAddressModal } from '@/modals/VerifiedAddressModal/VerifiedAddressModal.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { WalletConnectModal } from '@/modals/WalletConnectModal/WalletConnectModal.js';

export const Modals = memo(function Modals() {
    return (
        <NoSSR>
            {/* Shared Modals */}
            <ComposeModal ref={ComposeModalRef.register} />
            <DisconnectFireflyAccountModal ref={DisconnectFireflyAccountModalRef.register} />
            <DownloadMobileAppModal ref={DownloadMobileAppModalRef.register} />
            <LoginModal ref={LoginModalRef.register} />
            <LogoutModal ref={LogoutModalRef.register} />
            <SignInWithFireflyAppModal ref={SignInWithFireflyAppModalRef.register} />
            <SignInToFireflyAppModal ref={SignInToFireflyAppModalRef.register} />
            <Snackbar ref={SnackbarRef.register} />
            <WalletConnectModal ref={WalletConnectModalRef.register} />
            <ConfirmModal ref={ConfirmModalRef.register} />
            <SignupModal ref={SignupModalRef.register} />
            <ImageEditorModal ref={ImageEditorModalRef.register} />
            <ConfirmFireflyModal ref={ConfirmFireflyModalRef.register} />
            <PasswordModal ref={PasswordModalRef.register} />
            <ConfirmSyncSessionModal ref={ConfirmSyncSessionModalRef.register} />
            <AddLensManagerModal ref={AddLensManagerModalRef.register} />
            <DraggablePopover ref={DraggablePopoverRef.register} />
            <VerifiedAddressModal ref={VerifiedAddressModalRef.register} />

            <IfPathname isNotOneOf={WHITEBOARD_ROUTES}>
                <AddCustomERC20Modal ref={AddCustomERC20ModalRef.register} />
                <AddCustomERC721Modal ref={AddCustomERC721ModalRef.register} />
                <AddWalletModal ref={AddWalletModalRef.register} />
                <CollectArticleModal ref={CollectArticleModalRef.register} />
                <CollectPostModal ref={CollectPostModalRef.register} />
                <ConfirmLeavingModal ref={ConfirmLeavingModalRef.register} />
                <CreateFireflyAccountGuideModal ref={CreateFireflyAccountGuideModalRef.register} />
                <EditCrossAtModal ref={EditCrossAtModalRef.register} />
                <EditFireflyProfileModal ref={EditFireflyProfileModalRef.register} />
                <FrameViewerModal ref={FrameViewerModalRef.register} />
                <MyWalletsModal ref={MyWalletsModalRef.register} />
                <NonFungibleCollectionSelectModal ref={NonFungibleTokenCollectionSelectModalRef.register} />
                <PreviewMediaModal ref={PreviewMediaModalRef.register} />
                <RedPacketModal ref={RedPacketModalRef.register} />
                <SchedulePostModal ref={SchedulePostModalRef.register} />
                <ShareImageModal ref={ShareImageModalRef.register} />
                <SwapModal ref={SwapModalRef.register} />
                <TipsModal ref={TipsModalRef.register} />
                <TokenSelectorModal ref={TokenSelectorModalRef.register} />
                <RecoveryPhraseModal ref={RecoveryPhraseModalRef.register} />
            </IfPathname>
        </NoSSR>
    );
});
