import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode, useMemo } from 'react';
import { type RegisterOptions } from 'react-hook-form';

import { ErrorMessage, ValidationErrorCode } from '@/components/Form/ErrorMessage.js';
import { FormInput } from '@/components/Form/FormInput.js';
import { FormTextarea } from '@/components/Form/FormTextarea.js';
import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import {
    MAX_PROFILE_BIO_SIZE,
    MAX_PROFILE_DISPLAY_NAME_SIZE,
    MAX_PROFILE_HANDLE_SIZE,
    MIN_PROFILE_BIO_SIZE,
    MIN_PROFILE_HANDLE_SIZE,
} from '@/constants/limitation.js';
import { FARCASTER_USERNAME_REGEXP, LENS_USERNAME_REGEXP } from '@/constants/regexp.js';
import { autoWithSignal } from '@/helpers/autoWithSignal.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { ProfileAvatarSelector } from '@/modals/SignupModal/ProfileAvatarSelector.js';
import { checkHandleAvailability } from '@/services/checkHandleAvailability.js';
import { resolveLengthCalculator } from '@/services/resolveLengthCalculator.js';

interface SignupFormFieldsProps {
    source: SocialSource;
    disabled?: boolean;
}

function isBlank(str: string) {
    return !str || /^\s*$/.test(str);
}
function checkHandleFormat(source: SocialSource, handle: string): true | string {
    switch (source) {
        case Source.Lens: {
            LENS_USERNAME_REGEXP.lastIndex = 0;
            if (!LENS_USERNAME_REGEXP.test(handle)) {
                return ValidationErrorCode.LENS_HANDLE_ERROR;
            }

            return true;
        }
        case Source.Farcaster: {
            FARCASTER_USERNAME_REGEXP.lastIndex = 0;
            if (!FARCASTER_USERNAME_REGEXP.test(handle)) {
                return ValidationErrorCode.FAR_HANDLE_ERROR;
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

const validateHandle = autoWithSignal(checkHandleAvailability);

interface BaseFieldConfig {
    name: string;
    label: ReactNode;
    prefix?: string;
    options?: RegisterOptions;
}
type FieldConfig = BaseFieldConfig &
    (
        | {
              type: 'text';
              placeholder?: string;
          }
        | {
              type: 'textarea';
              placeholder?: ReactNode;
          }
    );

function getFieldsBySource(source: SocialSource): FieldConfig[] {
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
                    if (isBlank(value)) return ValidationErrorCode.NAME_EMPTY_ERROR;

                    if (resolveLengthCalculatorFn(value) > maxDisplayNameSize) {
                        return `${ValidationErrorCode.NAME_MAX_SIZE_ERROR}:${maxDisplayNameSize}`;
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
                    message: `${ValidationErrorCode.HANDLE_MIN_SIZE_ERROR}:${minHandleSize}`,
                },
                maxLength: {
                    value: maxHandleSize,
                    message: `${ValidationErrorCode.HANDLE_MAX_SIZE_ERROR}:${maxHandleSize}`,
                },
                validate: async (value: string) => {
                    if (isBlank(value)) return ValidationErrorCode.HANDLE_EMPTY_ERROR;

                    const formatCheck = checkHandleFormat(source, value);
                    if (formatCheck !== true) return formatCheck;

                    const checked = await runInSafeAsync(() =>
                        queryClient.fetchQuery({
                            queryKey: ['profile', 'check', source, value],
                            staleTime: 1000 * 40,
                            queryFn: () => validateHandle(source, value),
                        }),
                    );
                    if (checked === false) return ValidationErrorCode.HANDLE_NOT_AVAILABLE_ERROR;

                    return true;
                },
            },
        },
        {
            name: 'bio',
            label: <Trans>Bio</Trans>,
            type: 'textarea',
            placeholder: <Trans>Tell us something about you!</Trans>,
            options: {
                validate(value: string) {
                    if (!value) return true;

                    const length = resolveLengthCalculatorFn(value);
                    if (length < minBioSize) return `${ValidationErrorCode.BIO_MIN_SIZE_ERROR}:${minBioSize}`;
                    if (length > maxBioSize) return `${ValidationErrorCode.BIO_MAX_SIZE_ERROR}:${maxBioSize}`;

                    return true;
                },
            },
        },
    ];
}

export const SignupFormFields = memo<SignupFormFieldsProps>(function SignupFormFields({ source, disabled = false }) {
    const fields = useMemo(() => getFieldsBySource(source), [source]);

    return (
        <>
            <ProfileAvatarSelector disabled={disabled} />
            {fields.map((field) => {
                const fieldId = `signup-${field.name}`;
                const inputOptions = {
                    id: fieldId,
                    name: field.name,
                    readOnly: disabled,
                    options: field.options,
                    placeholder: field.placeholder,
                };

                return (
                    <div key={field.name} className="text-left">
                        <label className="text-main text-sm font-bold" htmlFor={fieldId}>
                            {field.label}
                        </label>
                        <div className="relative mt-1.5">
                            {field.prefix ? (
                                <span className="text-medium text-main absolute left-0 top-0 h-12 pl-3 text-center leading-[48px]">
                                    {field.prefix}
                                </span>
                            ) : null}
                            {field.type === 'text' ? (
                                <FormInput
                                    {...inputOptions}
                                    placeholder={field.placeholder}
                                    className={field.prefix ? '!pl-8' : ''}
                                />
                            ) : field.type === 'textarea' ? (
                                <FormTextarea
                                    {...inputOptions}
                                    className={classNames(
                                        'no-scrollbar h-[100px] resize-none',
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
