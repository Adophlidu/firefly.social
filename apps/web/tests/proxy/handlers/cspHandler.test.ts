import { NextRequest, NextResponse } from 'next/server.js';
import { describe, expect, test } from 'vitest';

import { handleCSP } from '@/proxy/handlers/cspHandler.js';

describe('CSP handler', () => {
    test('allows the Orb Chat Supabase HTTP and WebSocket origins', () => {
        const response = handleCSP(new NextRequest('https://firefly.social/messages'), () => NextResponse.next());
        const policy =
            response?.headers.get('Content-Security-Policy') ??
            response?.headers.get('Content-Security-Policy-Report-Only');

        expect(policy).toContain('https://ruiftgqhbghujyxlnjql.supabase.co');
        expect(policy).toContain('wss://ruiftgqhbghujyxlnjql.supabase.co');
    });

    test('allows blob workers for background realtime heartbeats', () => {
        const response = handleCSP(new NextRequest('https://firefly.social/messages'), () => NextResponse.next());
        const policy =
            response?.headers.get('Content-Security-Policy') ??
            response?.headers.get('Content-Security-Policy-Report-Only');

        expect(policy).toContain("worker-src 'self' blob:");
    });

    test('allows Hyperliquid HTTP and WebSocket origins', () => {
        const response = handleCSP(new NextRequest('https://firefly.social/perpetuals'), () => NextResponse.next());
        const policy =
            response?.headers.get('Content-Security-Policy') ??
            response?.headers.get('Content-Security-Policy-Report-Only');

        expect(policy).toContain('https://api.hyperliquid.xyz');
        expect(policy).toContain('wss://api.hyperliquid.xyz');
        expect(policy).toContain('https://api.hyperliquid-testnet.xyz');
        expect(policy).toContain('wss://api.hyperliquid-testnet.xyz');
    });
});
