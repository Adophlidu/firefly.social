import { FIREFLY_ROOT_URL, FIREFLY_ROOT_URL_DEV } from '@dimensiondev/constants/static';
import type { NextRequest, NextResponse } from 'next/server.js';

const DEVICE_ID_COOKIE = 'firefly_device_id';
const SHARER_SID_COOKIE = 'firefly_sharer_sid';
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24h, matches SHARER_SESSION_TTL

function resolveApiUrl() {
    const isDev = process.env.NEXT_PUBLIC_FIREFLY_DEV_API === 'enabled';
    return isDev ? FIREFLY_ROOT_URL_DEV : FIREFLY_ROOT_URL;
}

export function handleReferralTracking(request: NextRequest, response: NextResponse): void {
    const sid = request.nextUrl.searchParams.get('sid');
    if (!sid) return;

    const inviterSid = sid.trim();
    // Inviter sid may be a numeric ff uid OR an alphanumeric marketing sid — mirror the backend charset.
    if (!inviterSid || !/^[a-zA-Z0-9_-]+$/.test(inviterSid)) return;

    let deviceId = request.cookies.get(DEVICE_ID_COOKIE)?.value;
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        response.cookies.set(DEVICE_ID_COOKIE, deviceId, {
            path: '/',
            httpOnly: false,
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
        });
    }

    // Set sharer sid cookie so InitialProviders can persist it to localStorage
    response.cookies.set(SHARER_SID_COOKIE, inviterSid, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
    });

    // Fire-and-forget tracking event
    const apiUrl = resolveApiUrl();
    fetch(new URL('/v1/referral/track/event', apiUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            inviter_uid: inviterSid,
            invitee_device_id: deviceId,
            landing_url: request.url,
        }),
    }).catch(() => {});
}
