import { SessionType } from '@dimensiondev/enums';
import { bom } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { getOrCreateSharerSessionDeviceId, getSharerSessionId } from '@/helpers/sharerSession.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { settings } from '@/settings/index.js';

function resolveReferralUid(value: string | null | undefined): number | null {
    if (!value) return null;

    const uid = Number(value);
    if (!Number.isSafeInteger(uid) || uid <= 0) return null;

    return uid;
}

function getCurrentFireflyUid() {
    return resolveReferralUid(getSessionFromStorage(SessionType.Firefly)?.payload?.uid);
}

export async function trackReferralEvent(inviterUidRaw: string) {
    const inviterUid = resolveReferralUid(inviterUidRaw);
    if (!inviterUid) return;

    const currentFireflyUid = getCurrentFireflyUid();
    if (currentFireflyUid && currentFireflyUid === inviterUid) return;

    const landingUrl = bom.location?.href;
    const inviteeDeviceId = getOrCreateSharerSessionDeviceId();
    if (!landingUrl || !inviteeDeviceId) return;

    await fetchJson<string>(urlcat(settings.FIREFLY_ROOT_URL, '/v1/referral/track/event'), {
        method: 'POST',
        body: JSON.stringify({
            inviter_uid: inviterUid,
            invitee_device_id: inviteeDeviceId,
            landing_url: landingUrl,
        }),
    });
}

export async function trackReferralConversion(session: FireflySession | null | undefined) {
    if (!session) return;

    const inviterUid = resolveReferralUid(getSharerSessionId());
    const newUserUid = resolveReferralUid(session?.payload?.uid);
    const newUserDeviceId = getOrCreateSharerSessionDeviceId();

    if (!inviterUid || !newUserUid || !newUserDeviceId) return;
    if (inviterUid === newUserUid) return;

    await fetchJson<string>(urlcat(settings.FIREFLY_ROOT_URL, '/v1/referral/track/conversion'), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
            new_user_uid: newUserUid,
            new_user_device_id: newUserDeviceId,
            inviter_uid: inviterUid,
        }),
    });
}
