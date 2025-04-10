import {
    type SelfFundedTransactionRequest,
    type SponsoredTransactionRequest,
    ValidationError,
} from '@lens-protocol/client';

import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import type { OperationResult } from '@/providers/types/Lens.js';
import { sendSelfFundedTransaction } from '@/services/lensV3/sendSelfFundedTransaction.js';
import { sendSponsoredTransaction } from '@/services/lensV3/sendSponsoredTransaction.js';

function isSelfFundedTransactionRequest(x: { __typename: string }): x is SelfFundedTransactionRequest {
    return x.__typename === 'SelfFundedTransactionRequest';
}

function isSponsoredTransactionRequest(x: { __typename: string }): x is SponsoredTransactionRequest {
    return x.__typename === 'SponsoredTransactionRequest';
}

export async function handleOperationWithLensChain<T extends string, E extends string>(
    result: OperationResult<T, E>,
    waitForTransaction = true,
    sessionClient = lensSessionHolder.sessionClient,
) {
    if ('hash' in result) {
        return result.hash;
    }

    if (isSelfFundedTransactionRequest(result)) {
        const hash = await sendSelfFundedTransaction(result.raw);
        if (waitForTransaction) {
            await sessionClient.waitForTransaction(hash);
        }
        return hash;
    }

    if (isSponsoredTransactionRequest(result)) {
        const hash = await sendSponsoredTransaction(result.raw);
        if (waitForTransaction) {
            await sessionClient.waitForTransaction(hash);
        }
        return hash;
    }

    if ('reason' in result) {
        throw new Error(result.reason);
    }

    throw ValidationError.fromErrorResponse(result);
}
