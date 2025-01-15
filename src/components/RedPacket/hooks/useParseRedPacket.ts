import { useQuery } from '@tanstack/react-query';

import { type SocialSource } from '@/constants/enum.js';
import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { useProfileStore } from '@/hooks/useProfileStore.js';
import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';

/**
 * Parse RedPacket with post info.
 * Firefly only.
 */
export function useParseRedPacket(account: string, source: SocialSource, image?: string, enabled = true) {
    const { currentProfile } = useProfileStore(source);

    const query = useQuery({
        enabled,
        queryKey: ['red-packet', 'parse', source, image, account, currentProfile?.profileId],
        queryFn: async () => {
            if (!image) return;
            return FireflyRedPacketEndpoint.parse({
                image: {
                    imageUrl: image,
                },
                walletAddress: account,
                platform: resolveRedPacketPlatformType(source),
                profileId: currentProfile?.profileId,
            });
        },
    });
    return query.data;
}
