import type { FireflyAccountProfile, FireflyConnection } from '@/providers/types/Firefly.js';

export function formatFireflyAccountProfileFromFireflyConnections(
    fireflyConnections: FireflyConnection[],
): FireflyAccountProfile | null {
    const connection = fireflyConnections.find((x) => x.connected && x.uid);
    if (!connection) return null;
    return {
        displayName: connection?.displayName ?? null,
        avatar: connection?.avatar ?? null,
        uid: connection.uid!,
    };
}
