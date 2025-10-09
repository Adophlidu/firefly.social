import { XMarkIcon } from '@heroicons/react/24/outline';
import { omit } from 'lodash-es';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ErrorReportSnackbar, type ErrorReportSnackbarProps } from '@/components/ErrorReportSnackbar.js';
import type { OptionsObject, SnackbarKey, SnackbarMessage } from '@/components/Snackbar.js';
import { WarnSnackbar } from '@/components/WarnSnackbar.js';
import type { NODE_ENV } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { getDetailedErrorMessage } from '@/helpers/getDetailedErrorMessage.js';
import { getErrorMessageFromError, getWarningMessageFromError } from '@/helpers/getSnackbarMessageFromError.js';
import { SnackbarRef } from '@/modals/Snackbar.js';

export enum MessageKey {
    COMPOSE_ERROR_NOTIFICATION_KEY = 'COMPOSE_NOTIFICATION_KEY',
}

export interface MessageOptions extends OptionsObject {
    version?: string;
    environment?: NODE_ENV;
}

interface ErrorOptions extends OptionsObject, Pick<ErrorReportSnackbarProps, 'noReport' | 'icon'> {
    error?: unknown;
    /** If you don't want to display error stack */
    description?: string;
}

interface ErrorsOptions extends OptionsObject, Pick<ErrorReportSnackbarProps, 'noReport' | 'icon'> {
    errors?: unknown[];
    /** If you don't want to display error stack */
    description?: string;
}

function snackbarAction(key: SnackbarKey) {
    return (
        <ClickableButton
            className="flex size-6 items-center justify-center"
            onClick={() => {
                SnackbarRef.close({ key });
            }}
        >
            <XMarkIcon width={20} height={20} />
        </ClickableButton>
    );
}

function versionFilter(message: SnackbarMessage, options?: MessageOptions) {
    if (!options?.version) return true;
    return options.version === env.shared.VERSION;
}

function environmentFilter(message: SnackbarMessage, options?: MessageOptions) {
    if (!options?.environment) return true;
    return options.environment === env.shared.NODE_ENV;
}

/**
 * Filters for messages that should be displayed in the current environment.
 * A filter returns true means the message should be displayed.
 * A filter returns false means the message should be ignored.
 */
const MESSAGE_FILTERS = [versionFilter, environmentFilter];

export function enqueueInfoMessage(message: SnackbarMessage, options?: MessageOptions) {
    if (MESSAGE_FILTERS.some((filter) => !filter(message, options))) return;

    SnackbarRef.open({
        message,
        options: {
            variant: 'info',
            action: snackbarAction,
            ...options,
        },
    });
}

export function enqueueSuccessMessage(message: SnackbarMessage, options?: MessageOptions) {
    if (MESSAGE_FILTERS.some((filter) => !filter(message, options))) return;

    SnackbarRef.open({
        message,
        options: {
            variant: 'success',
            action: snackbarAction,
            ...options,
        },
    });
}

export function enqueueWarningMessage(message: SnackbarMessage, options?: MessageOptions) {
    if (MESSAGE_FILTERS.some((filter) => !filter(message, options))) return;

    SnackbarRef.open({
        message,
        options: {
            duration: 15 * 1000, // 15s
            variant: 'warning',
            ...options,
            content: (key: SnackbarKey, message?: SnackbarMessage) => <WarnSnackbar id={key} message={message} />,
        },
    });
}

export function enqueueErrorMessage(message: SnackbarMessage, options?: ErrorOptions) {
    if (MESSAGE_FILTERS.some((filter) => !filter(message, options))) return;

    const detail = options?.description || (options?.error ? getDetailedErrorMessage(options.error) : '') || '';

    SnackbarRef.open({
        message,
        options: {
            duration: 15 * 1000, // 15s
            variant: 'error',
            ...omit(options, 'icon'),
            content: (key: SnackbarKey, message?: SnackbarMessage) => (
                <ErrorReportSnackbar
                    id={key}
                    icon={options?.icon}
                    message={message}
                    detail={detail}
                    noReport={options?.noReport}
                />
            ),
        },
    });
}

export function enqueueErrorsMessage(message: SnackbarMessage, options?: ErrorsOptions) {
    if (MESSAGE_FILTERS.some((filter) => !filter(message, options))) return;

    const detailedMessage = options?.description || options?.errors?.map(getDetailedErrorMessage).join('\n').trim();

    SnackbarRef.open({
        message,
        options: {
            duration: 15 * 1000, // 15s
            variant: 'error',
            ...omit(options, 'icon'),
            content: (key: SnackbarKey, message?: SnackbarMessage) => (
                <ErrorReportSnackbar id={key} icon={options?.icon} message={message} detail={detailedMessage} />
            ),
        },
    });
}

export function enqueueMessageFromError(error: unknown, fallback: SnackbarMessage, options?: ErrorOptions) {
    const options_ = { error, ...options };
    const warningMessage = getWarningMessageFromError(error);

    if (warningMessage) {
        enqueueWarningMessage(warningMessage, options_);
        return;
    }

    const errorMessage = getErrorMessageFromError(error);
    if (errorMessage) {
        enqueueErrorMessage(errorMessage, options_);
        return;
    }

    // fallback message
    enqueueErrorMessage(fallback, options_);
}
