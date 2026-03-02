'use client';

import { memo } from 'react';

import { IfPathname } from '@/components/IfPathname.js';
import { NoSSR } from '@/components/NoSSR.js';
import { WHITEBOARD_ROUTES } from '@/constants/static.js';
import { AddCustomERC20Modal, AddCustomERC20ModalRef } from '@/modals/AddCustomERC20Modal.js';
import { AddCustomERC721Modal, AddCustomERC721ModalRef } from '@/modals/AddCustomERC721Modal.js';
import { AddLensManagerModal, AddLensManagerModalRef } from '@/modals/AddLensManagerModal/index.js';
import { AddWalletModal, AddWalletModalRef } from '@/modals/AddWalletModal/index.js';
import { CollectArticleModal, CollectArticleModalRef } from '@/modals/CollectArticleModal.js';
import { CollectPostModal, CollectPostModalRef } from '@/modals/CollectPostModal.js';
import { ComposeModal } from '@/modals/ComposeModal/index.js';
import { ComposeModalRef } from '@/modals/ComposeModal/refs.js';
import { ConfirmFireflyModal, ConfirmFireflyModalRef } from '@/modals/ConfirmFireflyModal.js';
import { ConfirmLeavingModal, ConfirmLeavingModalRef } from '@/modals/ConfirmLeavingModal.js';
import { ConfirmModal, ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { ConfirmSyncSessionModal, ConfirmSyncSessionModalRef } from '@/modals/ConfirmSyncSessionModal.js';
import {
    CreateFireflyAccountGuideModal,
    CreateFireflyAccountGuideModalRef,
} from '@/modals/CreateFireflyAccountGuideModal/index.js';
import {
    DisconnectFireflyAccountModal,
    DisconnectFireflyAccountModalRef,
} from '@/modals/DisconnectFireflyAccountModal.js';
import { DownloadMobileAppModal, DownloadMobileAppModalRef } from '@/modals/DownloadMobileAppModal/index.js';
import { DraggablePopover, DraggablePopoverRef } from '@/modals/DraggablePopover.js';
import {
    EditFireflyProfileModal,
    EditFireflyProfileModalRef,
} from '@/modals/EditFireflyProfileModal/EditFireflyProfileModal.js';
import { FrameViewerModal, FrameViewerModalRef } from '@/modals/FrameViewerModal/FrameViewerModal.js';
import { ImageEditorModal, ImageEditorModalRef } from '@/modals/ImageEditorModal.js';
import { LoginModal, LoginModalRef } from '@/modals/LoginModal/index.js';
import { LogoutModal, LogoutModalRef } from '@/modals/LogoutModal.js';
import { MyWalletsModal, MyWalletsModalRef } from '@/modals/MyWalletsModal/index.js';
import {
    NonFungibleCollectionSelectModal,
    NonFungibleTokenCollectionSelectModalRef,
} from '@/modals/NonFungibleCollectionSelectModal/index.js';
import { PasswordModal, PasswordModalRef } from '@/modals/PasswordModal/index.js';
import { PreviewMediaModal, PreviewMediaModalRef } from '@/modals/PreviewMediaModal/PreviewMediaModal.js';
import { RecoveryPhraseModal, RecoveryPhraseModalRef } from '@/modals/RecoveryPhraseModal.js';
import { RedPacketModal, RedPacketModalRef } from '@/modals/RedPacketModal/index.js';
import { SchedulePostModal, SchedulePostModalRef } from '@/modals/SchedulePostModal.js';
import { ShareImageModal, ShareImageModalRef } from '@/modals/ShareImageModal/index.js';
import { SignInToFireflyAppModal, SignInToFireflyAppModalRef } from '@/modals/SignInToFireflyAppModal.js';
import { SignInWithFireflyAppModal, SignInWithFireflyAppModalRef } from '@/modals/SignInWithFireflyAppModal.js';
import { SignupModal, SignupModalRef } from '@/modals/SignupModal/index.js';
import { Snackbar, SnackbarRef } from '@/modals/Snackbar.js';
import { SwapModal, SwapModalRef } from '@/modals/SwapModal/SwapModal.js';
import { TipsModal, TipsModalRef } from '@/modals/TipsModal/index.js';
import { TokenSelectorModal, TokenSelectorModalRef } from '@/modals/TokenSelectorModal.js';
import { VerifiedAddressModal, VerifiedAddressModalRef } from '@/modals/VerifiedAddressModal/index.js';
import { WalletConnectModal, WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';

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
