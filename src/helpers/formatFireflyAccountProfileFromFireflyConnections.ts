import { Source } from '@/constants/enum.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import type { FireflyAccountProfile, FireflyConnection } from '@/providers/types/Firefly.js';

export function formatFireflyAccountProfileFromFireflyConnections(
    fireflyConnections: FireflyConnection[],
): FireflyAccountProfile | null {
    const connection = fireflyConnections.find((x) => x.connected && x.uid);
    if (!connection) return null;
    const uid = connection.uid!;
    return {
        displayName: connection?.displayName ?? null,
        avatar: connection?.avatar ?? getStampAvatarByProfileId(Source.Firefly, uid),
        uid,
    };
}
