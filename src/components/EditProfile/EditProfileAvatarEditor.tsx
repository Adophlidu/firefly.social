'use client';

import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { BaseNotFound } from '@/components/BaseNotFound.js';
import { ImageEditorContent } from '@/components/ImageEditorContent.js';

export function EditProfileAvatarEditor({ name }: { name: string }) {
    const { history } = useRouter();
    const { setValue } = useFormContext();

    const pfp = (history.location.state as { pfp?: FileList }).pfp;
    const file = pfp?.[0];

    const onSave = useCallback(
        (blob: Blob) => {
            if (!blob || !file) return;
            setValue(name, new File([blob], 'pfp.png', { type: blob.type }), { shouldDirty: true });
            history.replace('/');
        },
        [file, history, name, setValue],
    );

    if (!file) {
        return (
            <BaseNotFound className="py-12">
                <div className="mt-11 text-sm font-bold text-fourMain">
                    <Trans>Unable to read image.</Trans>
                </div>
            </BaseNotFound>
        );
    }

    return <ImageEditorContent image={file} onSave={onSave} />;
}
