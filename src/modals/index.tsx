'use client';

import { memo } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { AddCustomERC20Modal, AddCustomERC20ModalRef } from '@/modals/AddCustomERC20Modal.js';
import { AddCustomERC721Modal, AddCustomERC721ModalRef } from '@/modals/AddCustomERC721Modal.js';
import { AddWalletModal, AddWalletModalRef } from '@/modals/AddWalletModal/index.js';
import { CollectArticleModal, CollectArticleModalRef } from '@/modals/CollectArticleModal.js';
import { CollectPostModal, CollectPostModalRef } from '@/modals/CollectPostModal.js';
import { ComposeModal, ComposeModalRef } from '@/modals/ComposeModal.js';
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
import { EditCrossAtModal, EditCrossAtModalRef } from '@/modals/EditCrossAtModal.js';
import {
    EditFireflyProfileModal,
    EditFireflyProfileModalRef,
} from '@/modals/EditFireflyProfileModal/EditFireflyProfileModal.js';
import { FrameViewerModal, FrameViewerModalRef } from '@/modals/FrameViewerModal/FrameViewerModal.js';
import { FreeMintModal, FreeMintModalRef } from '@/modals/FreeMintModal/index.js';
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
import { RedPacketModal, RedPacketModalRef } from '@/modals/RedPacketModal/index.js';
import { SchedulePostModal, SchedulePostModalRef } from '@/modals/SchedulePostModal.js';
import { ShareImageModal, ShareImageModalRef } from '@/modals/ShareImageModal/index.js';
import { SignInWithFireflyAppModal, SignInWithFireflyAppModalRef } from '@/modals/SignInWithFireflyAppModal.js';
import { Snackbar, SnackbarRef } from '@/modals/Snackbar.js';
import { SwapModal, SwapModalRef } from '@/modals/SwapModal/SwapModal.js';
import { TipsModal, TipsModalRef } from '@/modals/TipsModal/index.js';
import { TokenSelectorModal, TokenSelectorModalRef } from '@/modals/TokenSelectorModal.js';
import {
    TransactionSimulatorModal,
    TransactionSimulatorModalRef,
} from '@/modals/TransactionSimulatorModal/TransactionSimulatorModal.js';
import { WalletConnectModal, WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';

export const Modals = memo(function Modals() {
    return (
        <NoSSR>
            <LoginModal ref={LoginModalRef.register} />
            <LogoutModal ref={LogoutModalRef.register} />
            <ComposeModal ref={ComposeModalRef.register} />
            <ConfirmModal ref={ConfirmModalRef.register} />
            <ConfirmFireflyModal ref={ConfirmFireflyModalRef.register} />
            <ConfirmLeavingModal ref={ConfirmLeavingModalRef.register} />
            <DraggablePopover ref={DraggablePopoverRef.register} />
            <Snackbar ref={SnackbarRef.register} />
            <TipsModal ref={TipsModalRef.register} />
            <PreviewMediaModal ref={PreviewMediaModalRef.register} />
            <SchedulePostModal ref={SchedulePostModalRef.register} />
            <CollectArticleModal ref={CollectArticleModalRef.register} />
            <CollectPostModal ref={CollectPostModalRef.register} />
            <AddWalletModal ref={AddWalletModalRef.register} />
            <TransactionSimulatorModal ref={TransactionSimulatorModalRef.register} />
            <DisconnectFireflyAccountModal ref={DisconnectFireflyAccountModalRef.register} />
            <TokenSelectorModal ref={TokenSelectorModalRef.register} />
            <RedPacketModal ref={RedPacketModalRef.register} />
            <NonFungibleCollectionSelectModal ref={NonFungibleTokenCollectionSelectModalRef.register} />
            <ImageEditorModal ref={ImageEditorModalRef.register} />
            <FreeMintModal ref={FreeMintModalRef.register} />
            <FrameViewerModal ref={FrameViewerModalRef.register} />
            <AddCustomERC20Modal ref={AddCustomERC20ModalRef.register} />
            <AddCustomERC721Modal ref={AddCustomERC721ModalRef.register} />
            <WalletConnectModal ref={WalletConnectModalRef.register} />
            <MyWalletsModal ref={MyWalletsModalRef.register} />
            <EditFireflyProfileModal ref={EditFireflyProfileModalRef.register} />
            <SwapModal ref={SwapModalRef.register} />
            <SignInWithFireflyAppModal ref={SignInWithFireflyAppModalRef.register} />
            <PasswordModal ref={PasswordModalRef.register} />
            <EditCrossAtModal ref={EditCrossAtModalRef.register} />
            <ConfirmSyncSessionModal ref={ConfirmSyncSessionModalRef.register} />
            <CreateFireflyAccountGuideModal ref={CreateFireflyAccountGuideModalRef.register} />
            <ShareImageModal ref={ShareImageModalRef.register} />
            <DownloadMobileAppModal ref={DownloadMobileAppModalRef.register} />
        </NoSSR>
    );
});
