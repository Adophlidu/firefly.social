import { RealtimeClient, type RealtimeClientOptions } from '@supabase/realtime-js';

import type { ChatRealtimeSession } from '@/providers/orb/chat/types.js';

type HeartbeatStatus = Parameters<NonNullable<RealtimeClientOptions['heartbeatCallback']>>[0];

let client: RealtimeClient | undefined;
let clientProjectUrl: string | undefined;

export function shouldReconnectChatRealtime(status: HeartbeatStatus) {
    return status === 'disconnected' || status === 'timeout';
}

export function getChatRealtimeClient(session: ChatRealtimeSession) {
    if (!client || clientProjectUrl !== session.supabaseUrl) {
        const clientRef: { current?: RealtimeClient } = {};
        const nextClient = new RealtimeClient(new URL('realtime/v1', session.supabaseUrl).href, {
            params: { apikey: session.supabaseAnonKey, eventsPerSecond: 10 },
            worker: true,
            heartbeatCallback: (status) => {
                if (!shouldReconnectChatRealtime(status)) return;
                queueMicrotask(() => clientRef.current?.connect());
            },
        });
        clientRef.current = nextClient;
        client = nextClient;
        clientProjectUrl = session.supabaseUrl;
    }
    return client;
}
