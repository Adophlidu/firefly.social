import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getOrCreateSharerSessionDeviceId, getSharerSessionId } from '@/helpers/sharerSession.js';
import { trackReferralConversion } from '@/providers/firefly/referral/trackReferral.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';

vi.mock('@/providers/firefly/SessionHolder.js', () => ({
    fireflySessionHolder: {
        fetchWithSession: vi.fn(),
    },
}));

vi.mock('@/helpers/fetchJson.js', () => ({
    fetchJson: vi.fn(),
}));

vi.mock('@/helpers/sharerSession.js', () => ({
    getSharerSessionId: vi.fn(),
    getOrCreateSharerSessionDeviceId: vi.fn(),
}));

// Used only by trackReferralEvent — mock it so its heavy transitive imports
// (SessionFactory → JSX) don't load for the conversion tests.
vi.mock('@/helpers/getSessionFromStorage.js', () => ({
    getSessionFromStorage: vi.fn(),
}));

const mockedFetchWithSession = vi.mocked(fireflySessionHolder.fetchWithSession);
const mockedGetSharerSessionId = vi.mocked(getSharerSessionId);
const mockedGetOrCreateSharerSessionDeviceId = vi.mocked(getOrCreateSharerSessionDeviceId);

/** Minimal session fixture — `trackReferralConversion` only reads `payload.uid`. */
function buildSession(uid: string | undefined): FireflySession {
    return { payload: { uid } } as unknown as FireflySession;
}

describe('trackReferralConversion', () => {
    beforeEach(() => {
        mockedFetchWithSession.mockReset();
        mockedGetSharerSessionId.mockReset();
        mockedGetOrCreateSharerSessionDeviceId.mockReset();
    });

    it('posts the conversion via fetchWithSession with the new-user uid and inviter sid', async () => {
        mockedGetSharerSessionId.mockReturnValue('marketing-sid_test-1');
        mockedGetOrCreateSharerSessionDeviceId.mockReturnValue('device-abc');

        await trackReferralConversion(buildSession('123'));

        expect(mockedFetchWithSession).toHaveBeenCalledTimes(1);
        expect(mockedFetchWithSession).toHaveBeenCalledWith(
            expect.stringContaining('/v1/referral/track/conversion'),
            expect.objectContaining({ method: 'POST' }),
        );

        const [, init] = mockedFetchWithSession.mock.calls[0]!;
        expect(JSON.parse(init?.body as string)).toEqual({
            new_user_uid: 123,
            new_user_device_id: 'device-abc',
            inviter_uid: 'marketing-sid_test-1',
        });
    });

    it('does NOT pass a manual Authorization header (regression: empty Bearer for v3 users)', async () => {
        mockedGetSharerSessionId.mockReturnValue('inviter-1');
        mockedGetOrCreateSharerSessionDeviceId.mockReturnValue('device-abc');

        await trackReferralConversion(buildSession('123'));

        // The caller must not set its own bearer — fetchWithSession injects the live v3 token.
        const [, init] = mockedFetchWithSession.mock.calls[0]!;
        expect(init?.headers).toBeUndefined();
    });

    it('returns early when there is no session', async () => {
        await trackReferralConversion(null);
        expect(mockedFetchWithSession).not.toHaveBeenCalled();
    });

    it('returns early when the session has no firefly uid', async () => {
        mockedGetSharerSessionId.mockReturnValue('inviter-1');
        mockedGetOrCreateSharerSessionDeviceId.mockReturnValue('device-abc');

        await trackReferralConversion(buildSession(undefined));
        expect(mockedFetchWithSession).not.toHaveBeenCalled();
    });

    it('returns early when there is no sharer sid', async () => {
        mockedGetSharerSessionId.mockReturnValue(undefined);
        mockedGetOrCreateSharerSessionDeviceId.mockReturnValue('device-abc');

        await trackReferralConversion(buildSession('123'));
        expect(mockedFetchWithSession).not.toHaveBeenCalled();
    });

    it('returns early when there is no device id', async () => {
        mockedGetSharerSessionId.mockReturnValue('inviter-1');
        mockedGetOrCreateSharerSessionDeviceId.mockReturnValue(undefined);

        await trackReferralConversion(buildSession('123'));
        expect(mockedFetchWithSession).not.toHaveBeenCalled();
    });

    it('returns early on self-referral (inviter sid equals the new user uid)', async () => {
        mockedGetSharerSessionId.mockReturnValue('123');
        mockedGetOrCreateSharerSessionDeviceId.mockReturnValue('device-abc');

        await trackReferralConversion(buildSession('123'));
        expect(mockedFetchWithSession).not.toHaveBeenCalled();
    });
});
