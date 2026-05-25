import EditIcon from '@dimensiondev/assets/edit.svg';
import { ALLOWED_IMAGES_MIMES } from '@dimensiondev/constants/computed';
import { first } from 'lodash-es';
import { memo } from 'react';
import { useFormContext } from 'react-hook-form';

import { EditProfileAvatar } from '@/components/EditProfile/EditProfileAvatar.js';
import { ImageEditorModalRef } from '@/modals/ImageEditorModal/refs.js';

interface Props {
    disabled?: boolean;
}

const AVATAR_SELECTOR_ID = 'signup-avatar-upload';

export const ProfileAvatarSelector = memo<Props>(function ProfileAvatarSelector({ disabled }) {
    const form = useFormContext();

    return (
        <div className="mx-auto size-[120px]">
            <label htmlFor={disabled ? undefined : AVATAR_SELECTOR_ID} className="relative cursor-pointer">
                <EditProfileAvatar pfp="" name="pfp" size={120} />
                <div className="absolute bottom-1 right-1 z-10 flex size-6 items-center justify-center rounded-full bg-main text-primaryBottom">
                    <EditIcon className="size-3.5 shrink-0" />
                </div>
            </label>
            <input
                className="hidden"
                type="file"
                id={AVATAR_SELECTOR_ID}
                accept={ALLOWED_IMAGES_MIMES.join(', ')}
                onChange={async (e) => {
                    const file = first(e.target.files);
                    if (!file) return;

                    const updatedFile = await ImageEditorModalRef.openAndWaitForClose({
                        file,
                    });
                    if (!updatedFile) return;

                    form.setValue('pfp', updatedFile, {
                        shouldDirty: true,
                    });
                }}
            />
        </div>
    );
});
