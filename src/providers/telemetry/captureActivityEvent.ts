'use client';

import { nativeBridgeProvider } from '@firefly/native-bridge';
import { createLookupTableResolver, parseUrl } from '@firefly/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { ReferralAccountPlatform } from '@/helpers/resolveActivityUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getAllRelatedProfileInfo } from '@/providers/firefly/getAllRelatedProfileInfo.js';
import { getPublicParameters } from '@/providers/telemetry/getPublicParameters.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId, type Events } from '@/providers/types/Telemetry.js';

const resolveActivityLoginEventId = createLookupTableResolver<SocialSource, EventId>(
    {
        [Source.Twitter]: EventId.EVENT_X_LOG_IN_SUCCESS,
        [Source.Farcaster]: EventId.EVENT_FARCASTER_LOG_IN_SUCCESS,
        [Source.Lens]: EventId.EVENT_LENS_LOG_IN_SUCCESS,
        [Source.Bsky]: EventId.EVENT_BSKY_LOG_IN_SUCCESS,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

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

export async function captureActivityClaimEvent(address: string, isPremium: boolean) {
    return runInSafeAsync(async () => {
        await captureActivityEvent(
            isPremium ? EventId.EVENT_CLAIM_PREMIUM_SUCCESS : EventId.EVENT_CLAIM_BASIC_SUCCESS,
            getWalletEventParameters(address),
        );
    });
}

export async function captureActivityConnectWalletEvent(address: string) {
    return runInSafeAsync(async () => {
        await captureActivityEvent(EventId.EVENT_CONNECT_WALLET_SUCCESS, getWalletEventParameters(address));
    });
}

export async function captureActivityChangeWalletEvent(address: string) {
    return runInSafeAsync(async () => {
        await captureActivityEvent(EventId.EVENT_CHANGE_WALLET_SUCCESS, getWalletEventParameters(address));
    });
}

export async function captureActivityLoginEventBySocialSource(source: SocialSource) {
    return runInSafeAsync(async () => {
        await captureActivityEvent(resolveActivityLoginEventId(source), {});
    });
}
