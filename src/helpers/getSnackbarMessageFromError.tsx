import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import type { SnackbarMessage } from 'notistack';
import { EstimateGasExecutionError, UserRejectedRequestError } from 'viem';
import { z } from 'zod';

import { SnackbarErrorMessage } from '@/components/SnackbarErrorMessage.js';
import { DecryptionError, FarcasterInvalidSignerKey, FetchError, UserRejectionError } from '@/constants/error.js';
import { getErrorMessageFromFetchError } from '@/helpers/getErrorMessageFromFetchError.js';

interface SolanaError {
    code: number;
    message: string;
}

const ClientErrorSchema = z.object({
    response: z.object({
        errors: z.array(
            z.object({
                message: z.string(),
            }),
        ),
    }),
});

function isRejectedMessage(message: string) {
    return !message
        ? false
        : ['user rejected the request', 'user denied request'].some((m) => message.toLowerCase().includes(m));
}

export function getWarningMessageFromError(error: unknown, fallback?: string) {
    let currentError = error;
    const visited = new Set();

    // For solana wallet adapter
    if (
        error instanceof Error &&
        (isRejectedMessage(error.message) ||
            ('error' in error && isRejectedMessage((error.error as SolanaError)?.message)))
    ) {
        return t`The user rejected the request.`;
    }

    // UserRejectedRequestError from viem
    while (currentError instanceof Error && !visited.has(currentError)) {
        visited.add(currentError);
        if (currentError instanceof UserRejectedRequestError) {
            return t`The user rejected the request.`;
        }
        currentError = currentError.cause;
    }

    return fallback;
}

/**
 * Get a snackbar message from an error.
 * @param error
 * @param fallback the fallback message if error is not an instance of Error
 * @returns
 */
export function getErrorMessageFromError(error: unknown, fallback?: string): SnackbarMessage {
    if (error) {
        const clientErrorParsed = ClientErrorSchema.safeParse(error);
        const message = clientErrorParsed.success ? first(clientErrorParsed.data.response.errors)?.message : null;
        if (message) return message;
    }

    if (error instanceof FetchError) {
        return getErrorMessageFromFetchError(error);
    }

    if (error instanceof FarcasterInvalidSignerKey) {
        return (
            <SnackbarErrorMessage
                title={<Trans>Invalid signer key</Trans>}
                message={
                    <Trans>
                        The signer is not authorized to perform the requested operation. Please approve again.
                    </Trans>
                }
            />
        );
    }

    if (error instanceof EstimateGasExecutionError) {
        return <SnackbarErrorMessage title={<Trans>Insufficient funds</Trans>} message={error.shortMessage} />;
    }

    if (error instanceof UserRejectionError) {
        return (
            <SnackbarErrorMessage
                title={<Trans>Canceled</Trans>}
                message={<Trans>The user canceled the operation.</Trans>}
            />
        );
    }

    if (error instanceof DecryptionError) {
        return error.message;
    }

    return fallback;
}
