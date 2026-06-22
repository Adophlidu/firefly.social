import { SessionType } from '@dimensiondev/enums';
import { bom } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { getOrCreateSharerSessionDeviceId, getSharerSessionId } from '@/helpers/sharerSession.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { settings } from '@/settings/index.js';

const SID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Inviter sid: numeric ff uid OR alphanumeric marketing sid (matches backend charset). */
function resolveInviterSid(value: string | null | undefined): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return SID_PATTERN.test(trimmed) ? trimmed : null;
}

/** New-user Firefly uid — the invitee is always an ff account; backend requires a positive int. */
function resolveFireflyUid(value: string | null | undefined): number | null {
    if (!value) return null;
    const uid = Number(value);
    if (!Number.isSafeInteger(uid) || uid <= 0) return null;
    return uid;
}

export async function trackReferralEvent(inviterSidRaw: string) {
    const inviterSid = resolveInviterSid(inviterSidRaw);
    if (!inviterSid) return;

    const currentFireflyUid = resolveFireflyUid(getSessionFromStorage(SessionType.Firefly)?.payload?.uid);
    // Compare as strings so it only matches when the sid is the current user's own numeric uid.
    if (currentFireflyUid && String(currentFireflyUid) === inviterSid) return;

    const landingUrl = bom.location?.href;
    const inviteeDeviceId = getOrCreateSharerSessionDeviceId();
    if (!landingUrl || !inviteeDeviceId) return;

    await fetchJson<string>(urlcat(settings.FIREFLY_ROOT_URL, '/v1/referral/track/event'), {
        method: 'POST',
        body: JSON.stringify({
            inviter_uid: inviterSid,
            invitee_device_id: inviteeDeviceId,
            landing_url: landingUrl,
        }),
    });
}

export async function trackReferralConversion(session: FireflySession | null | undefined) {
    if (!session) return;

    const inviterSid = resolveInviterSid(getSharerSessionId());
    const newUserUid = resolveFireflyUid(session?.payload?.uid);
    const newUserDeviceId = getOrCreateSharerSessionDeviceId();

    if (!inviterSid || !newUserUid || !newUserDeviceId) return;
    // Compare as strings so it only matches when the inviter sid is the new user's own numeric uid.
    if (String(newUserUid) === inviterSid) return;

    await fetchJson<string>(urlcat(settings.FIREFLY_ROOT_URL, '/v1/referral/track/conversion'), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
            new_user_uid: newUserUid,
            new_user_device_id: newUserDeviceId,
            inviter_uid: inviterSid,
        }),
    });
}
