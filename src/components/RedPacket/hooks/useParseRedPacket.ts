import { useQuery } from '@tanstack/react-query';
import { compact, first } from 'lodash-es';

import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { useProfileStore } from '@/hooks/useProfileStore.js';
import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';
import type { Post } from '@/providers/types/SocialMedia.js';

/**
 * Parse RedPacket with post info.
 * With `account`, would parse and check the availability.
 * Without `account`, would only parse.
 */
export function useParseRedPacket(account: string, post: Post, enabled = true) {
    const source = post.source;
    const { currentProfile } = useProfileStore(source);
    const image = first(
        compact(post.metadata.content?.attachments?.filter((x) => x.type === 'Image').map((x) => x.uri)),
    );

    const { data, isLoading } = useQuery({
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
    return { parsed: data, payloadImage: data?.redpacket?.payload ? image : undefined, isLoading };
}
