import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode, useMemo } from 'react';
import type { RegisterOptions } from 'react-hook-form';

import { ErrorMessage } from '@/components/Form/ErrorMessage.js';
import { FormInput } from '@/components/Form/FormInput.js';
import { FormTextarea } from '@/components/Form/FormTextarea.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import {
    MAX_PROFILE_BIO_SIZE,
    MAX_PROFILE_DISPLAY_NAME_SIZE,
    MAX_PROFILE_HANDLE_SIZE,
    MIN_PROFILE_BIO_SIZE,
    MIN_PROFILE_HANDLE_SIZE,
} from '@/constants/limitation.js';
import { FARCASTER_USERNAME_REGEXP, LENS_USERNAME_REGEXP } from '@/constants/regexp.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { ProfileAvatarSelector } from '@/modals/SignupModal/ProfileAvatarSelector.js';
import { resolveLengthCalculator } from '@/services/resolveLengthCalculator.js';

interface SignupFormFieldsProps {
    source: SocialSource;
}

function isBlank(str: string) {
    return !str || /^\s*$/.test(str);
}
function checkHandleFormat(source: SocialSource, handle: string): true | string {
    switch (source) {
        case Source.Lens: {
            LENS_USERNAME_REGEXP.lastIndex = 0;
            if (!LENS_USERNAME_REGEXP.test(handle)) {
                return t`User Name must start with a letter/number, only _ allowed in between`;
            }

            return true;
        }
        case Source.Farcaster: {
            FARCASTER_USERNAME_REGEXP.lastIndex = 0;
            if (!FARCASTER_USERNAME_REGEXP.test(handle)) {
                return t`User Name can only contain letters, numbers, and -`;
            }

            return true;
        }
        case Source.Twitter:
        case Source.Bsky:
            return true;
        default:
            safeUnreachable(source);
            return true;
    }
}
async function checkHandleAvailability(source: SocialSource, handle: string): Promise<boolean> {
    const profile = await runInSafeAsync(() => resolveSocialMediaProvider(source).getProfileByHandle(handle));

    return !profile;
}

function getFieldsBySource(source: SocialSource): Array<{
    name: string;
    label: ReactNode;
    prefix?: string;
    type: 'text' | 'textarea';
    options?: RegisterOptions;
}> {
    const maxBioSize = MAX_PROFILE_BIO_SIZE[source] ?? 0;
    const minBioSize = MIN_PROFILE_BIO_SIZE[source] ?? 0;
    const minHandleSize = MIN_PROFILE_HANDLE_SIZE[source] ?? 0;
    const maxHandleSize = MAX_PROFILE_HANDLE_SIZE[source] ?? 0;
    const maxDisplayNameSize = MAX_PROFILE_DISPLAY_NAME_SIZE[source] ?? 0;

    const resolveLengthCalculatorFn = resolveLengthCalculator(source);

    return [
        {
            name: 'displayName',
            label: <Trans>Display Name</Trans>,
            type: 'text',
            options: {
                required: true,
                validate(value: string) {
                    if (isBlank(value)) return t`Display Name should not be blank`;

                    if (resolveLengthCalculatorFn(value) > maxDisplayNameSize) {
                        return t`Display Name should not exceed ${maxDisplayNameSize} characters`;
                    }

                    return true;
                },
            },
        },
        {
            name: 'handle',
            label: <Trans>Username</Trans>,
            type: 'text',
            prefix: '@',
            options: {
                required: true,
                minLength: {
                    value: minHandleSize,
                    message: t`User Name should be at least ${minHandleSize} characters`,
                },
                maxLength: {
                    value: maxHandleSize,
                    message: t`User Name should not exceed ${maxBioSize} characters`,
                },
                validate: async (value: string) => {
                    if (isBlank(value)) return t`User Name should not be blank`;

                    const formatCheck = checkHandleFormat(source, value);
                    if (formatCheck !== true) return formatCheck;

                    // TODO: optimize availability check with debounce
                    // const isAvailable = await checkHandleAvailability(source, value);
                    // if (!isAvailable) return t`User Name is not available`;

                    return true;
                },
            },
        },
        {
            name: 'bio',
            label: <Trans>Bio</Trans>,
            type: 'textarea',
            options: {
                validate(value: string) {
                    if (!value) return true;
                    if (isBlank(value)) return t`Bio should not be blank`;

                    const length = resolveLengthCalculatorFn(value);
                    if (length < minBioSize) return t`Bio should be at least ${minBioSize} characters`;
                    if (length > maxBioSize) return t`Bio should not exceed ${maxBioSize} characters`;

                    return true;
                },
            },
        },
    ];
}

export const SignupFormFields = memo<SignupFormFieldsProps>(function SignupFormFields({ source }) {
    const fields = useMemo(() => getFieldsBySource(source), [source]);

    return (
        <>
            <ProfileAvatarSelector />
            {fields.map((field) => {
                const fieldId = `signup-${field.name}`;

                return (
                    <div key={field.name} className="text-left">
                        <label className="text-sm font-bold text-main" htmlFor={fieldId}>
                            {field.label}
                        </label>
                        <div className="relative">
                            {field.prefix ? (
                                <span className="absolute left-0 top-1.5 h-12 pl-3 text-center text-medium leading-[48px] text-main">
                                    {field.prefix}
                                </span>
                            ) : null}
                            {field.type === 'text' ? (
                                <FormInput
                                    id={fieldId}
                                    name={field.name}
                                    options={field.options}
                                    className={classNames('mt-1.5', field.prefix ? '!pl-8' : '')}
                                />
                            ) : field.type === 'textarea' ? (
                                <FormTextarea
                                    id={fieldId}
                                    name={field.name}
                                    options={field.options}
                                    className={classNames(
                                        'no-scrollbar mt-1.5 h-[100px] resize-none',
                                        field.prefix ? '!pl-8' : '',
                                    )}
                                />
                            ) : null}
                        </div>
                        <ErrorMessage className="mt-1.5" name={field.name} />
                    </div>
                );
            })}
        </>
    );
});
