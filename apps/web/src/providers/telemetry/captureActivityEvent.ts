'use client';

import { nativeBridgeProvider } from '@dimensiondev/native-bridge';
import { parseUrl } from '@dimensiondev/utils';

import { memoizePromise } from '@/helpers/memoizePromise.js';
import { ReferralAccountPlatform } from '@/helpers/resolveActivityUrl.js';
import { getAllRelatedProfileInfo } from '@/providers/firefly/endpoint/getAllRelatedProfileInfo.js';
import { getPublicParameters } from '@/providers/telemetry/getPublicParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId, type Events } from '@/providers/types/Telemetry.js';

const getFireflyWalletProfile = memoizePromise(
    async function getFireflyWalletProfile() {
        return getAllRelatedProfileInfo(undefined, true);
    },
    () => 'firefly-wallet-profile',
);

export async function captureActivityEvent<E extends EventId>(
    eventId: E,
    parameters: Omit<Events[E]['parameters'], 'firefly_account_id' | 'activity'> & {
        firefly_account_id?: string;
    },
) {
    if (!parameters.firefly_account_id) delete parameters.firefly_account_id; // filter undefined or null

    if (nativeBridgeProvider.supported) {
        const response = await getFireflyWalletProfile();
        if (response?.fireflyAccountId) parameters.firefly_account_id = response.fireflyAccountId;
    }

    const url = parseUrl(location.href);
    const referralCode = url?.searchParams.get('r');
    const referralParameters =
        [
            EventId.EVENT_CONNECT_WALLET_SUCCESS,
            EventId.EVENT_CHANGE_WALLET_SUCCESS,
            EventId.EVENT_CLAIM_BASIC_SUCCESS,
            EventId.EVENT_CLAIM_PREMIUM_SUCCESS,
        ].includes(eventId) &&
        referralCode &&
        url?.searchParams.get('p') === ReferralAccountPlatform.X
            ? {
                  referral_x_handle: referralCode,
              }
            : {};

    return TelemetryProvider.captureEventInSafe(eventId, {
        ...referralParameters,
        ...getPublicParameters(eventId, null),
        ...parameters,
    } as Events[E]['parameters']);
}
