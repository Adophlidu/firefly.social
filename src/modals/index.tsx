'use client';

import { memo } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { AddCustomERC20Modal } from '@/modals/AddCustomERC20Modal.js';
import { AddCustomERC721Modal } from '@/modals/AddCustomERC721Modal.js';
import { AddWalletModal } from '@/modals/AddWalletModal.js';
import { ChannelSelectModal } from '@/modals/ChannelSelectModal/index.js';
import { CollectArticleModal } from '@/modals/CollectArticleModal.js';
import { CollectPostModal } from '@/modals/CollectPostModal.js';
import { ComposeModal } from '@/modals/ComposeModal.js';
import { ConfirmFireflyModal } from '@/modals/ConfirmFireflyModal.js';
import { ConfirmLeavingModal } from '@/modals/ConfirmLeavingModal.js';
import { ConfirmModal } from '@/modals/ConfirmModal.js';
import { ConfirmSyncSessionModal } from '@/modals/ConfirmSyncSessionModal.js';
import * as controls from '@/modals/controls.js';
import { CreateFireflyAccountGuideModal } from '@/modals/CreateFireflyAccountGuideModal/index.js';
import { DisconnectFireflyAccountModal } from '@/modals/DisconnectFireflyAccountModal.js';
import { DraggablePopover } from '@/modals/DraggablePopover.js';
import { EditCrossAtModal } from '@/modals/EditCrossAtModal.js';
import { EditFireflyProfileModal } from '@/modals/EditFireflyProfileModal.js';
import { EnableSignlessModal } from '@/modals/EnableSignlessModal.js';
import { FrameViewerModal } from '@/modals/FrameViewerModal/index.js';
import { FreeMintModal } from '@/modals/FreeMintModal/index.js';
import { ImageEditorModal } from '@/modals/ImageEditor/ImageEditorModal.js';
import { LoginModal } from '@/modals/LoginModal/index.js';
import { LogoutModal } from '@/modals/LogoutModal.js';
import { MyWalletsModal } from '@/modals/MyWalletsModal/index.js';
import { NonFungibleCollectionSelectModal } from '@/modals/NonFungibleCollectionSelectModal/index.js';
import { PasswordModal } from '@/modals/PasswordModal/index.js';
import { PreviewMediaModal } from '@/modals/PreviewMediaModal.js';
import { RedPacketModal } from '@/modals/RedPacketModal/index.js';
import { SchedulePostModal } from '@/modals/SchedulePostModal.js';
import { SearchRecipientModal } from '@/modals/SearchRecipientModal.js';
import { ShareImageModal } from '@/modals/ShareImageModal.js';
import { SignInWithFireflyAppModal } from '@/modals/SignInWithFireflyAppModal.js';
import { Snackbar } from '@/modals/Snackbar.js';
import { SwapModal } from '@/modals/SwapModal/SwapModal.js';
import { TipsModal } from '@/modals/TipsModal/index.js';
import { TokenSelectorModal } from '@/modals/TokenSelectorModal.js';
import { TransactionSimulatorModal } from '@/modals/TransactionSimulatorModal/TransactionSimulatorModal.js';
import { WalletConnectModal } from '@/modals/WalletConnectModal/index.js';

export const Modals = memo(function Modals() {
    return (
        <NoSSR>
            <LoginModal ref={controls.LoginModalRef.register} />
            <LogoutModal ref={controls.LogoutModalRef.register} />
            <ComposeModal ref={controls.ComposeModalRef.register} />
            <ConfirmModal ref={controls.ConfirmModalRef.register} />
            <ConfirmFireflyModal ref={controls.ConfirmFireflyModalRef.register} />
            <ConfirmLeavingModal ref={controls.ConfirmLeavingModalRef.register} />
            <DraggablePopover ref={controls.DraggablePopoverRef.register} />
            <Snackbar ref={controls.SnackbarRef.register} />
            <TipsModal ref={controls.TipsModalRef.register} />
            <PreviewMediaModal ref={controls.PreviewMediaModalRef.register} />
            <SchedulePostModal ref={controls.SchedulePostModalRef.register} />
            <CollectArticleModal ref={controls.CollectArticleModalRef.register} />
            <EnableSignlessModal ref={controls.EnableSignlessModalRef.register} />
            <CollectPostModal ref={controls.CollectPostModalRef.register} />
            <AddWalletModal ref={controls.AddWalletModalRef.register} />
            <TransactionSimulatorModal ref={controls.TransactionSimulatorModalRef.register} />
            <DisconnectFireflyAccountModal ref={controls.DisconnectFireflyAccountModalRef.register} />
            <TokenSelectorModal ref={controls.TokenSelectorModalRef.register} />
            <RedPacketModal ref={controls.RedPacketModalRef.register} />
            <NonFungibleCollectionSelectModal ref={controls.NonFungibleTokenCollectionSelectModalRef.register} />
            <ImageEditorModal ref={controls.ImageEditorModalRef.register} />
            <FreeMintModal ref={controls.FreeMintModalRef.register} />
            <FrameViewerModal ref={controls.FrameViewerModalRef.register} />
            <AddCustomERC20Modal ref={controls.AddCustomERC20ModalRef.register} />
            <AddCustomERC721Modal ref={controls.AddCustomERC721ModalRef.register} />
            <ChannelSelectModal ref={controls.ChannelSelectModalRef.register} />
            <WalletConnectModal ref={controls.WalletConnectModalRef.register} />
            <MyWalletsModal ref={controls.MyWalletsModalRef.register} />
            <EditFireflyProfileModal ref={controls.EditFireflyProfileModalRef.register} />
            <SwapModal ref={controls.SwapModalRef.register} />
            <SignInWithFireflyAppModal ref={controls.SignInWithFireflyAppModalRef.register} />
            <PasswordModal ref={controls.PasswordModalRef.register} />
            <EditCrossAtModal ref={controls.EditCrossAtModalRef.register} />
            <ConfirmSyncSessionModal ref={controls.ConfirmSyncSessionModalRef.register} />
            <CreateFireflyAccountGuideModal ref={controls.CreateFireflyAccountGuideModalRef.register} />
            <ShareImageModal ref={controls.ShareImageModalRef.register} />
            <SearchRecipientModal ref={controls.SearchRecipientModalRef.register} />
        </NoSSR>
    );
});
