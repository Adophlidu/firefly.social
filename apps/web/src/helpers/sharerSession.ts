import { bom } from '@dimensiondev/utils';

const SHARER_SESSION_KEY = 'firefly.sharer-session';
const SHARER_SESSION_TTL = 24 * 60 * 60 * 1000;

interface SharerSession {
    sid: string;
    detectedAt: number;
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
        };
    } catch {
        return null;
    }
}

export function persistSharerSession(sid: string) {
    if (!sid) return;

    bom.localStorage?.setItem(
        SHARER_SESSION_KEY,
        JSON.stringify({
            sid,
            detectedAt: Date.now(),
        } satisfies SharerSession),
    );
}

export function getSharerSessionId(): string | undefined {
    const session = parseSharerSession(bom.localStorage?.getItem(SHARER_SESSION_KEY) ?? null);
    if (!session) return undefined;

    if (Date.now() - session.detectedAt > SHARER_SESSION_TTL) {
        bom.localStorage?.removeItem(SHARER_SESSION_KEY);
        return undefined;
    }

    return session.sid;
}
