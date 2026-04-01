'use client';

import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps } from 'react';
import { type Control, useFormState } from 'react-hook-form';

interface ErrorMessageProps extends HTMLProps<HTMLParagraphElement> {
    name: string;
    control?: Control;
}
interface Props {
    errorCode: string;
}

export enum ValidationErrorCode {
    LENS_HANDLE_ERROR = 'LENS_HANDLE_ERROR',
    FAR_HANDLE_ERROR = 'FAR_HANDLE_ERROR',
    HANDLE_MIN_SIZE_ERROR = 'HANDLE_MIN_SIZE_ERROR',
    HANDLE_MAX_SIZE_ERROR = 'HANDLE_MAX_SIZE_ERROR',
    HANDLE_EMPTY_ERROR = 'HANDLE_EMPTY_ERROR',
    HANDLE_NOT_AVAILABLE_ERROR = 'HANDLE_NOT_AVAILABLE_ERROR',
    NAME_EMPTY_ERROR = 'NAME_EMPTY_ERROR',
    NAME_MAX_SIZE_ERROR = 'NAME_MAX_SIZE_ERROR',
    BIO_MIN_SIZE_ERROR = 'BIO_MIN_SIZE_ERROR',
    BIO_MAX_SIZE_ERROR = 'BIO_MAX_SIZE_ERROR',
}

function ValidationErrorMessage({ errorCode }: Props) {
    const [code, extra] = errorCode.split(':') as [ValidationErrorCode, string];

    switch (code) {
        case ValidationErrorCode.LENS_HANDLE_ERROR:
            return <Trans>User Name must start with a letter/number, only _ allowed in between</Trans>;
        case ValidationErrorCode.FAR_HANDLE_ERROR:
            return (
                <Trans>User Name can only contain lowercase letters, numbers, and -, and should not start with -</Trans>
            );
        case ValidationErrorCode.HANDLE_MIN_SIZE_ERROR:
            return <Trans>User Name should be at least {extra} characters</Trans>;
        case ValidationErrorCode.HANDLE_MAX_SIZE_ERROR:
            return <Trans>User Name should not exceed {extra} characters</Trans>;
        case ValidationErrorCode.HANDLE_EMPTY_ERROR:
            return <Trans>User Name should not be blank</Trans>;
        case ValidationErrorCode.HANDLE_NOT_AVAILABLE_ERROR:
            return <Trans>User Name is not available</Trans>;
        case ValidationErrorCode.NAME_EMPTY_ERROR:
            return <Trans>Display Name should not be blank</Trans>;
        case ValidationErrorCode.NAME_MAX_SIZE_ERROR:
            return <Trans>Display Name should not exceed {extra} characters</Trans>;
        case ValidationErrorCode.BIO_MIN_SIZE_ERROR:
            return <Trans>Bio should be at least {extra} characters</Trans>;
        case ValidationErrorCode.BIO_MAX_SIZE_ERROR:
            return <Trans>Bio should not exceed {extra} characters</Trans>;
        default:
            safeUnreachable(code);
            return errorCode;
    }
}

export function ErrorMessage({ name, control, className, ...rest }: ErrorMessageProps) {
    const { errors } = useFormState({ control });
    const message = errors[name]?.message;
    if (!message || typeof message !== 'string') return null;
    return (
        <p className={classNames('text-xs font-medium leading-4 text-fail', className)} {...rest}>
            <ValidationErrorMessage errorCode={message} />
        </p>
    );
}
