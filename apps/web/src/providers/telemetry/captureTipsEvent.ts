import { runInSafeAsync } from '@dimensiondev/utils';

import { memoizePromise } from '@/helpers/memoizePromise.js';
import { resolveFireflyAccountId } from '@/helpers/resolveFireflyProfileId.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type FireflyIdentity } from '@/providers/types/Firefly.js';
import { EventId, type Events } from '@/providers/types/Telemetry.js';

const resolveFireflyAccountIdCached = memoizePromise(
    async (identity: FireflyIdentity) => {
        return resolveFireflyAccountId(identity);
    },
    (identity) => `${identity.source}-${identity.id}`,
);

export function captureTipsSwitchWalletEvent(identity: FireflyIdentity, targetWalletAddress: string) {
    return runInSafeAsync(async () => {
        const targetAccountId = await resolveFireflyAccountIdCached(identity);

        return TelemetryProvider.captureEvent(EventId.TIPS_SWITCH_RECIPIENT, {
            target_firefly_account_id: targetAccountId || '',
            target_wallet_address: targetWalletAddress,
        });
    });
}

export function captureTipsSharePostEvent(identity: FireflyIdentity, hash: string) {
    return runInSafeAsync(async () => {
        const targetAccountId = await resolveFireflyAccountIdCached(identity);

        return TelemetryProvider.captureEvent(EventId.TIPS_SHARE_POST_SUCCESS, {
            target_firefly_account_id: targetAccountId || '',
            transaction_id: hash,
        });
    });
}

export function captureTipsSendEvent(
    eventId: EventId.TIPS_SEND_SUBMIT | EventId.TIPS_SEND_SUCCESS,
    parameters: Omit<
        Events[EventId.TIPS_SEND_SUCCESS]['parameters'],
        'firefly_account_id' | 'wallet_name' | 'wallet_type'
    >,
) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(eventId, {
            ...parameters,
            ...getWalletEventParameters(parameters.wallet_address),
        });
    });
}
