import { useState } from 'react';

import { EditFireflyProfileRouter } from '@/components/EditFireflyProfile/EditFireflyProfileRouter.js';
import { Modal } from '@/components/Modal.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { FireflyAccountProfile } from '@/providers/types/Firefly.js';

export interface EditFireflyProfileModalOpenProps {
    profile?: FireflyAccountProfile | null;
    fallbackDisplayName?: string | null;
}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<EditFireflyProfileModalOpenProps>>;
};

export function EditFireflyProfileModal({ ref }: Props) {
    const [profile, setProfile] = useState<FireflyAccountProfile | undefined>(undefined);
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            if (props.profile) {
                if (!props.profile.displayName && props.fallbackDisplayName) {
                    setProfile({ ...props.profile, displayName: props.fallbackDisplayName });
                    return;
                }
                setProfile(props.profile);
            }
        },
        onClose: () => {
            setProfile(undefined);
        },
    });

    return (
        <Modal open={open} onClose={() => dispatch?.close()} dialogPanelClassName="flex-col">
            <div className="relative flex w-[100vw] flex-grow flex-col overflow-auto bg-lightBottom shadow-popover transition-all dark:bg-darkBottom dark:text-gray-950 md:h-auto md:max-h-[800px] md:w-[600px] md:rounded-xl lg:flex-grow-0">
                <EditFireflyProfileRouter profile={profile} onClose={() => dispatch?.close()} />
            </div>
        </Modal>
    );
}
