'use client';

import { Trans } from '@lingui/react/macro';

import { EditProfileDialogContent } from '@/components/EditProfile/EditProfileDialogContent.js';
import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function EditProfileDialog({
    profile,
    onClose,
    open,
}: {
    profile: Profile;
    onClose: () => void;
    open: boolean;
}) {
    return (
        <Modal open={open} onClose={onClose} dialogPanelClassName="flex-col" disableDialogClose>
            <div className="bg-primaryBottom shadow-popover relative flex w-screen grow flex-col overflow-auto transition-all md:h-auto md:max-h-[800px] md:w-[455px] md:rounded-xl lg:grow-0">
                <div className="bg-primaryBottom shadow-popover relative flex w-screen grow flex-col overflow-auto transition-all md:h-auto md:max-h-[800px] md:w-[455px] md:rounded-xl lg:grow-0">
                    <ModalTitle title={<Trans>Edit Profile</Trans>} onClose={onClose} />
                    <EditProfileDialogContent profile={profile} onClose={onClose} />
                </div>
            </div>
        </Modal>
    );
}
