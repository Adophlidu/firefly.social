import type { NextRequestContext } from '@dimensiondev/types';
import { NextRequest } from 'next/server.js';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { POST } from '@/app/api/orb/chat/[action]/route.js';

vi.mock('@dimensiondev/envs/web', () => ({
    envs: {
        internal: {
            ORB_SUPABASE_URL: 'https://orb-chat.supabase.co',
            ORB_SUPABASE_ANON_KEY: 'orb-anon-key',
        },
    },
}));

afterEach(() => vi.unstubAllGlobals());

describe('Orb interactive action proxy', () => {
    test('mints a chat token and returns normalized payment request details', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(Response.json({ status: 'SUCCESS', data: { token: 'chat-token' } }))
            .mockResolvedValueOnce(
                Response.json([
                    {
                        amount: '1',
                        currency_symbol: 'GHO',
                        status: 'PENDING',
                        metadata: { message: 'For lunch' },
                    },
                ]),
            );
        vi.stubGlobal('fetch', fetchMock);
        const request = new NextRequest('http://localhost/api/orb/chat/get-interactive-action', {
            method: 'POST',
            headers: { 'x-access-token': 'Bearer lens-token' },
            body: JSON.stringify({ interactiveActionId: 'tip-1' }),
        });
        const context: NextRequestContext = { params: Promise.resolve({ action: 'get-interactive-action' }) };

        const response = await POST(request, context);

        await expect(response.json()).resolves.toEqual({
            status: 'SUCCESS',
            data: { amount: 1, currencySymbol: 'GHO', status: 'PENDING', message: 'For lunch' },
        });
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining('/create-chat-token'),
            expect.objectContaining({ headers: expect.objectContaining({ 'x-access-token': 'Bearer lens-token' }) }),
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining('/rest/v1/interactive_actions?'),
            expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer chat-token' }) }),
        );
    });
});

describe('Orb realtime session proxy', () => {
    test('returns the Supabase connection details with a short-lived chat token', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(Response.json({ status: 'SUCCESS', data: { token: 'chat-token' } }));
        vi.stubGlobal('fetch', fetchMock);
        const request = new NextRequest('http://localhost/api/orb/chat/create-chat-realtime-session', {
            method: 'POST',
            headers: { 'x-access-token': 'Bearer lens-token' },
            body: '{}',
        });
        const context: NextRequestContext = {
            params: Promise.resolve({ action: 'create-chat-realtime-session' }),
        };

        const response = await POST(request, context);

        await expect(response.json()).resolves.toEqual({
            status: 'SUCCESS',
            data: {
                token: 'chat-token',
                supabaseUrl: expect.any(String),
                supabaseAnonKey: expect.any(String),
            },
        });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/create-chat-token'),
            expect.objectContaining({ headers: expect.objectContaining({ 'x-access-token': 'Bearer lens-token' }) }),
        );
    });
});
