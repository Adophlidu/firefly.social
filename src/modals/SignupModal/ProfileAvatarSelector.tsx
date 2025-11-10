import { first } from 'lodash-es';
import { memo } from 'react';
import { useFormContext } from 'react-hook-form';

import EditIcon from '@/assets/edit.svg';
import { EditProfileAvatar } from '@/components/EditProfile/EditProfileAvatar.js';
import { ALLOWED_IMAGES_MIMES } from '@/constants/index.js';
import { ImageEditorModalRef } from '@/modals/ImageEditorModal.js';

export const ProfileAvatarSelector = memo(function ProfileAvatarSelector() {
    const form = useFormContext();

    return (
        <div className="mx-auto size-[120px]">
            <label htmlFor="signup-avatar-upload" className="relative cursor-pointer">
                <EditProfileAvatar pfp="" name="pfp" size={120} />
                <div className="absolute bottom-1 right-1 z-10 flex size-6 items-center justify-center rounded-full bg-main text-primaryBottom">
                    <EditIcon className="size-3.5 shrink-0" />
                </div>
            </label>
            <input
                className="hidden"
                type="file"
                id="signup-avatar-upload"
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
