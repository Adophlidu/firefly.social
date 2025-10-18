import { EditProfileRouter } from '@/components/EditProfile/EditProfileRouter.js';
import { Modal } from '@/components/Modal.js';
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
        <Modal
            open={open}
            onClose={onClose}
            dialogPanelClassName="flex-col"
            disableScrollLock={false}
            disableDialogClose
        >
            <div className="relative flex w-screen grow flex-col overflow-auto bg-primaryBottom shadow-popover transition-all md:h-auto md:max-h-[800px] md:w-[455px] md:rounded-xl lg:grow-0">
                <EditProfileRouter onClose={onClose} profile={profile} />
            </div>
        </Modal>
    );
}
