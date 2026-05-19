'use client';

import EditIcon from '@dimensiondev/assets/edit.svg';
import { ALLOWED_IMAGES_MIMES } from '@dimensiondev/constants/computed';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { rootRouteId, useRouteContext, useRouter } from '@tanstack/react-router';
import { compact, first } from 'lodash-es';
import { useFormContext } from 'react-hook-form';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Path } from '@/components/EditFireflyProfile/EditFireflyProfileRouter.js';
import type { EditFireflyProfileFromValues } from '@/components/EditFireflyProfile/EditFireflyProfileRouteRoot.js';
import { EditProfileAvatar } from '@/components/EditProfile/EditProfileAvatar.js';
import { ErrorMessage } from '@/components/Form/ErrorMessage.js';
import { FormInput } from '@/components/Form/FormInput.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { FIREFLY_DISPLAY_NAME_REGEXP } from '@/constants/regexp.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { ImageEditorModalRef } from '@/modals/ImageEditorModal/refs.js';
import { updateProfile } from '@/providers/firefly/endpoint/updateProfile.js';
import { captureEditProfileSuccessEvent } from '@/providers/telemetry/captureProfileActionEvent.js';
import type { FireflyProfileUpdateParams } from '@/providers/types/Firefly.js';
import { uploadToS3 } from '@/services/uploadToS3.js';

export function EditFireflyProfileForm() {
    const { history } = useRouter();
    const queryClient = useQueryClient();
    const context = useRouteContext({ from: rootRouteId });

    const form = useFormContext<EditFireflyProfileFromValues>();
    const {
        handleSubmit,
        formState: { isSubmitting, isDirty, isValid, dirtyFields },
    } = form;

    const onSubmit = async (values: EditFireflyProfileFromValues) => {
        try {
            const params: FireflyProfileUpdateParams = {
                displayName: values.displayName,
            };
            if (values.avatar) params.avatar = await uploadToS3(values.avatar);
            await updateProfile(params);
            await queryClient.refetchQueries({ queryKey: ['wallet-profiles'] });
            await queryClient.refetchQueries({ queryKey: ['allConnections'] });
            await queryClient.refetchQueries({ queryKey: ['firefly-profile'] });

            captureEditProfileSuccessEvent(
                compact([
                    dirtyFields.avatar ? 'change_avatar' : undefined,
                    dirtyFields.displayName ? 'change_nickname' : undefined,
                ]),
            );
            enqueueSuccessMessage(<Trans>Updated profile successfully</Trans>);
            context?.onClose?.();
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to update profile.</Trans>);
            throw error;
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-1 flex-col text-left">
            <div className="flex flex-col items-center p-4 text-center">
                <div className="mb-10">
                    <label htmlFor="avatar-upload" className="relative cursor-pointer">
                        <EditProfileAvatar pfp={context.profile?.avatar} name="avatar" size={120} />
                        <div className="bg-main text-primaryBottom absolute bottom-1 right-1 z-10 flex size-6 items-center justify-center rounded-full">
                            <EditIcon className="size-3.5 shrink-0" />
                        </div>
                    </label>
                    <input
                        className="hidden"
                        type="file"
                        id="avatar-upload"
                        accept={ALLOWED_IMAGES_MIMES.join(', ')}
                        onChange={async (e) => {
                            const file = first(e.target.files);
                            if (!file) return;

                            const updatedFile = await ImageEditorModalRef.openAndWaitForClose({
                                file,
                            });
                            if (!updatedFile) return;

                            form.setValue('avatar', updatedFile, {
                                shouldDirty: true,
                            });
                            history.replace(Path.Root);
                        }}
                    />
                </div>
                <label htmlFor="display-name-input" className="text-main mb-6 text-sm font-bold leading-[18px]">
                    <Trans>Nickname</Trans>
                </label>
                <FormInput
                    name="displayName"
                    className="w-full text-center"
                    placeholder={t`Enter your nickname on Firefly`}
                    options={{
                        required: true,
                        minLength: {
                            value: 1,
                            message: t`Display Name should not be blank`,
                        },
                        maxLength: {
                            value: 20,
                            message: t`Display Name should not exceed 20 characters`,
                        },
                        pattern: {
                            value: FIREFLY_DISPLAY_NAME_REGEXP,
                            message: t`Nickname must not contain restricted symbols`,
                        },
                    }}
                />
                <ErrorMessage name="displayName" className="mt-2" />
            </div>
            <div className="shadow-accountCardShadowLight mt-auto flex w-full justify-end p-4">
                <ClickableButton
                    enableDefault
                    enablePropagate
                    type="submit"
                    disabled={!isDirty || !isValid || isSubmitting}
                    className="bg-main text-medium text-primaryBottom flex h-10 w-[120px] items-center justify-center rounded-full font-bold leading-10"
                >
                    {isSubmitting ? <LoadingIcon size={16} /> : <Trans>Save</Trans>}
                </ClickableButton>
            </div>
        </form>
    );
}
