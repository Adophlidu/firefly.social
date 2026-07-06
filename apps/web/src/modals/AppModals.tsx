'use client';

import { AddCustomERC20Modal } from '@/modals/AddCustomERC20Modal/AddCustomERC20Modal.js';
import { AddCustomERC20ModalRef } from '@/modals/AddCustomERC20Modal/refs.js';
import { AddCustomERC721Modal } from '@/modals/AddCustomERC721Modal/AddCustomERC721Modal.js';
import { AddCustomERC721ModalRef } from '@/modals/AddCustomERC721Modal/refs.js';
import { AddWalletModal } from '@/modals/AddWalletModal/AddWalletModal.js';
import { AddWalletModalRef } from '@/modals/AddWalletModal/refs.js';
import { CollectArticleModal } from '@/modals/CollectArticleModal/CollectArticleModal.js';
import { CollectArticleModalRef } from '@/modals/CollectArticleModal/refs.js';
import { CollectPostModal } from '@/modals/CollectPostModal/CollectPostModal.js';
import { CollectPostModalRef } from '@/modals/CollectPostModal/refs.js';
import { ComposeModal } from '@/modals/ComposeModal/ComposeModal.js';
import { ComposeModalRef } from '@/modals/ComposeModal/refs.js';
import { ConfirmLeavingModal } from '@/modals/ConfirmLeavingModal/ConfirmLeavingModal.js';
import { ConfirmLeavingModalRef } from '@/modals/ConfirmLeavingModal/refs.js';
import { CreateFireflyAccountGuideModal } from '@/modals/CreateFireflyAccountGuideModal/CreateFireflyAccountGuideModal.js';
import { CreateFireflyAccountGuideModalRef } from '@/modals/CreateFireflyAccountGuideModal/refs.js';
import { EditCrossAtModal } from '@/modals/EditCrossAtModal/EditCrossAtModal.js';
import { EditCrossAtModalRef } from '@/modals/EditCrossAtModal/refs.js';
import { EditFireflyProfileModal } from '@/modals/EditFireflyProfileModal/EditFireflyProfileModal.js';
import { EditFireflyProfileModalRef } from '@/modals/EditFireflyProfileModal/refs.js';
import { EditProfileModal } from '@/modals/EditProfileModal/EditProfileModal.js';
import { EditProfileModalRef } from '@/modals/EditProfileModal/refs.js';
import { FrameViewerModal } from '@/modals/FrameViewerModal/FrameViewerModal.js';
import { FrameViewerModalRef } from '@/modals/FrameViewerModal/refs.js';
import { MyWalletsModal } from '@/modals/MyWalletsModal/MyWalletsModal.js';
import { MyWalletsModalRef } from '@/modals/MyWalletsModal/refs.js';
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
import { TipsModalRef } from '@/modals/TipsModal/refs.js';
import { TipsModal } from '@/modals/TipsModal/TipsModal.js';
import { TokenSelectorModalRef } from '@/modals/TokenSelectorModal/refs.js';
import { TokenSelectorModal } from '@/modals/TokenSelectorModal/TokenSelectorModal.js';
import { VerifiedAddressModalRef } from '@/modals/VerifiedAddressModal/refs.js';
import { VerifiedAddressModal } from '@/modals/VerifiedAddressModal/VerifiedAddressModal.js';

/**
 * Modals that are never used on whiteboard routes (e.g. /signup). Split into its
 * own chunk and rendered only on non-whiteboard routes so the heavy wallet
 * cluster these modals pull in (wagmi / AppKit / WalletConnect / red packet /
 * compose) stays out of whiteboard first paint.
 */
export function AppModals() {
    return (
        <>
            <AddCustomERC20Modal ref={AddCustomERC20ModalRef.register} />
            <AddCustomERC721Modal ref={AddCustomERC721ModalRef.register} />
            <AddWalletModal ref={AddWalletModalRef.register} />
            <CollectArticleModal ref={CollectArticleModalRef.register} />
            <CollectPostModal ref={CollectPostModalRef.register} />
            <ComposeModal ref={ComposeModalRef.register} />
            <ConfirmLeavingModal ref={ConfirmLeavingModalRef.register} />
            <CreateFireflyAccountGuideModal ref={CreateFireflyAccountGuideModalRef.register} />
            <EditCrossAtModal ref={EditCrossAtModalRef.register} />
            <EditFireflyProfileModal ref={EditFireflyProfileModalRef.register} />
            <EditProfileModal ref={EditProfileModalRef.register} />
            <FrameViewerModal ref={FrameViewerModalRef.register} />
            <MyWalletsModal ref={MyWalletsModalRef.register} />
            <PreviewMediaModal ref={PreviewMediaModalRef.register} />
            <RedPacketModal ref={RedPacketModalRef.register} />
            <SchedulePostModal ref={SchedulePostModalRef.register} />
            <ShareImageModal ref={ShareImageModalRef.register} />
            <TipsModal ref={TipsModalRef.register} />
            <TokenSelectorModal ref={TokenSelectorModalRef.register} />
            <RecoveryPhraseModal ref={RecoveryPhraseModalRef.register} />
            <VerifiedAddressModal ref={VerifiedAddressModalRef.register} />
        </>
    );
}
