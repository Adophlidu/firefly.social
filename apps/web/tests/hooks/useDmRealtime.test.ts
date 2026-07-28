import { describe, expect, test, vi } from 'vitest';

import {
    encodeAddressToByteaHexAscii,
    getRealtimeTokenRefreshDelay,
    shouldRefreshDmCounters,
    shouldRefreshRealtimeToken,
} from '@/hooks/useDmRealtime.js';
import { getChatRealtimeClient, shouldReconnectChatRealtime } from '@/providers/orb/chat/supabase.js';

function createUnsignedToken(payload: Record<string, unknown>) {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `header.${encodedPayload}.signature`;
}

describe('DM realtime helpers', () => {
    test('encodes a normalized Lens address for the Postgres bytea filter', () => {
        expect(encodeAddressToByteaHexAscii('0xAbC')).toBe('\\x3078616263');
    });

    test('refreshes the chat token one minute before it expires', () => {
        const now = Date.UTC(2026, 6, 20, 0, 0, 0);
        const token = createUnsignedToken({ exp: (now + 5 * 60_000) / 1_000 });

        expect(getRealtimeTokenRefreshDelay(token, now)).toBe(4 * 60_000);
    });

    test('uses a safe fallback for an invalid chat token', () => {
        expect(getRealtimeTokenRefreshDelay('invalid-token', 0)).toBe(10 * 60_000);
    });

    test('refreshes only missing, invalid, or expiring chat tokens on visibility changes', () => {
        const now = Date.UTC(2026, 6, 20, 0, 0, 0);

        expect(shouldRefreshRealtimeToken(undefined, now)).toBe(true);
        expect(shouldRefreshRealtimeToken('invalid-token', now)).toBe(true);
        expect(shouldRefreshRealtimeToken(createUnsignedToken({ exp: (now + 30_000) / 1_000 }), now)).toBe(true);
        expect(shouldRefreshRealtimeToken(createUnsignedToken({ exp: (now + 5 * 60_000) / 1_000 }), now)).toBe(false);
    });

    test('does not refresh counters while the visible channel is receiving messages', () => {
        expect(shouldRefreshDmCounters('active', 'active')).toBe(false);
        expect(shouldRefreshDmCounters('other', 'active')).toBe(true);
    });

    test('refreshes counters after the visible channel has been marked read', () => {
        expect(shouldRefreshDmCounters('active', 'active', true)).toBe(true);
    });

    test('reconnects realtime after heartbeat disconnects and timeouts', () => {
        expect(shouldReconnectChatRealtime('disconnected')).toBe(true);
        expect(shouldReconnectChatRealtime('timeout')).toBe(true);
        expect(shouldReconnectChatRealtime('ok')).toBe(false);
    });

    test('uses a worker heartbeat and reconnects after a timeout', async () => {
        const client = getChatRealtimeClient({
            token: 'token',
            supabaseUrl: 'https://realtime-test.supabase.co',
            supabaseAnonKey: 'anon-key',
        });
        const connect = vi.spyOn(client, 'connect').mockImplementation(() => undefined);

        expect(client.worker).toBe(true);
        client.heartbeatCallback('timeout');
        await Promise.resolve();

        expect(connect).toHaveBeenCalledOnce();
    });
});
