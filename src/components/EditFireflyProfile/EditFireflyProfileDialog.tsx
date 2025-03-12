import { EditFireflyProfileRouter } from '@/components/EditFireflyProfile/EditFireflyProfileRouter.js';
import { Modal } from '@/components/Modal.js';
import type { FireflyAccountProfile } from '@/providers/types/Firefly.js';

interface Props {
    open: boolean;
    onClose: () => void;
    profile?: FireflyAccountProfile;
}

export function EditFireflyProfileDialog({ open, onClose, profile }: Props) {
    return (
        <Modal open={open} onClose={onClose} dialogPanelClassName="flex-col">
            <div className="relative flex w-[100vw] flex-grow flex-col overflow-auto bg-lightBottom shadow-popover transition-all dark:bg-darkBottom dark:text-gray-950 md:h-auto md:max-h-[800px] md:w-[600px] md:rounded-xl lg:flex-grow-0">
                <EditFireflyProfileRouter onClose={onClose} profile={profile} />
            </div>
        </Modal>
    );
}
