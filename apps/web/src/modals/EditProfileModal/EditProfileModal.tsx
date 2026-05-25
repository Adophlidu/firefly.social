import { delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type Ref, useState } from 'react';

import { EditProfileDialogContent } from '@/components/EditProfile/EditProfileDialogContent.js';
import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { EditProfileModalRefType } from '@/modals/EditProfileModal/refs.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    ref: Ref<EditProfileModalRefType>;
}

export function EditProfileModal({ ref }: Props) {
    const [profile, setProfile] = useState<Profile | undefined>(undefined);
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProfile(props.profile);
        },
        onClose: async () => {
            await delay(200);
            setProfile(undefined);
        },
    });

    return (
        <Modal open={open} onClose={() => dispatch?.close()} dialogPanelClassName="flex-col" disableDialogClose>
            {profile ? (
                <div className="relative flex h-screen min-h-0 w-screen flex-col overflow-hidden bg-lightBottom transition-all dark:bg-darkBottom dark:text-gray-950 md:h-auto md:max-h-[min(800px,100vh-2rem)] md:w-[600px] md:flex-[0] md:overflow-hidden md:rounded-xl lg:grow-0">
                    <div className="relative flex shrink-0 items-center justify-between pt-safe">
                        <ModalTitle title={<Trans>Edit Profile</Trans>} onClose={() => dispatch?.close()} />
                    </div>
                    <EditProfileDialogContent profile={profile} onClose={() => dispatch?.close()} />
                </div>
            ) : null}
        </Modal>
    );
}
