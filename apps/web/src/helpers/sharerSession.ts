import { bom } from '@dimensiondev/utils';

const SHARER_SESSION_KEY = 'firefly.sharer-session';
const SHARER_SESSION_TTL = 24 * 60 * 60 * 1000;

interface SharerSession {
    sid: string;
    detectedAt: number;
    deviceId?: string;
}

function parseSharerSession(raw: string | null): SharerSession | null {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Partial<SharerSession>;
        if (!parsed.sid || typeof parsed.sid !== 'string') return null;
        if (!parsed.detectedAt || typeof parsed.detectedAt !== 'number') return null;
        return {
            sid: parsed.sid,
            detectedAt: parsed.detectedAt,
            deviceId: typeof parsed.deviceId === 'string' ? parsed.deviceId : undefined,
        };
    } catch {
        return null;
    }
}

function createSharerDeviceId() {
    return globalThis.crypto?.randomUUID?.();
}

function getValidSharerSession(): SharerSession | null {
    const session = parseSharerSession(bom.localStorage?.getItem(SHARER_SESSION_KEY) ?? null);
    if (!session) return null;

    if (Date.now() - session.detectedAt > SHARER_SESSION_TTL) {
        bom.localStorage?.removeItem(SHARER_SESSION_KEY);
        return null;
    }

    return session;
}

export function persistSharerSession(sid: string) {
    if (!sid) return;

    const deviceId = getValidSharerSession()?.deviceId ?? createSharerDeviceId();
    bom.localStorage?.setItem(
        SHARER_SESSION_KEY,
        JSON.stringify({
            sid,
            detectedAt: Date.now(),
            deviceId,
        } satisfies SharerSession),
    );
}

export function getSharerSessionId(): string | undefined {
    return getValidSharerSession()?.sid;
}

export function getOrCreateSharerSessionDeviceId(): string | undefined {
    const session = getValidSharerSession();
    if (!session) return undefined;
    if (session.deviceId) return session.deviceId;

    const deviceId = createSharerDeviceId();
    if (!deviceId) return undefined;

    bom.localStorage?.setItem(
        SHARER_SESSION_KEY,
        JSON.stringify({
            ...session,
            deviceId,
        } satisfies SharerSession),
    );
    return deviceId;
}
