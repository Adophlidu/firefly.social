import { FormProvider, useForm } from 'react-hook-form';

import { EditProfileForm, type ProfileFormValues } from '@/components/EditProfile/EditProfileForm.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface EditProfileDialogContentProps {
    profile: Profile;
    onClose: () => void;
}

export function EditProfileDialogContent({ profile, onClose }: EditProfileDialogContentProps) {
    const form = useForm<ProfileFormValues>({
        defaultValues: {
            displayName: profile.displayName,
            bio: profile.bio,
            website: profile.website,
            location: profile.location,
        },
        mode: 'onChange',
    });

    return (
        <FormProvider {...form}>
            <EditProfileForm profile={profile} onClose={onClose} />
        </FormProvider>
    );
}
