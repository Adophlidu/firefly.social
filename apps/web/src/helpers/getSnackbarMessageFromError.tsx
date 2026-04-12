import { UserRejectionError } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { EstimateGasExecutionError } from 'viem';
import { z } from 'zod';

import type { SnackbarMessage } from '@/components/Snackbar.js';
import { SnackbarErrorMessage } from '@/components/SnackbarErrorMessage.js';
import { DecryptionError, FarcasterInvalidSignerKey, FetchError } from '@/constants/error.js';
import { getErrorMessageFromFetchError } from '@/helpers/getErrorMessageFromFetchError.js';
import { isInsufficientGasError } from '@/helpers/isInsufficientGasError.js';
import { isUserRejectErrorInWallet } from '@/helpers/isUserRejectErrorInWallet.js';

const ClientErrorSchema = z.object({
    response: z.object({
        errors: z.array(
            z.object({
                message: z.string(),
            }),
        ),
    }),
});

export function getWarningMessageFromError(error: unknown, fallback?: string) {
    if (isUserRejectErrorInWallet(error)) {
        return t`The user rejected the request.`;
    }
    if (isInsufficientGasError(error)) {
        return t`Insufficient gas.`;
    }

    return fallback;
}

/**
 * Get a snackbar message from an error.
 * @param error
 * @param fallback the fallback message if error is not an instance of Error
 * @returns
 */
export function getErrorMessageFromError(error: unknown, fallback?: SnackbarMessage): SnackbarMessage {
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
