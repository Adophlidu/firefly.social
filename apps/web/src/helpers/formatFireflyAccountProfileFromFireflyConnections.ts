import { Source } from '@/constants/enum.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { type FireflyAccountProfile, type FireflyConnection } from '@/providers/types/Firefly.js';

export function formatFireflyAccountProfileFromFireflyConnections(
    fireflyConnections: FireflyConnection[],
    useDefaultAvatar = true,
): FireflyAccountProfile | null {
    const connection = fireflyConnections.find((x) => x.connected && x.uid);
    if (!connection) return null;
    const uid = connection.uid!;
    return {
        displayName: connection?.displayName ?? null,
        avatar: connection?.avatar ?? (useDefaultAvatar ? getStampAvatarByProfileId(Source.Firefly, uid) : null),
        uid,
    };
}
