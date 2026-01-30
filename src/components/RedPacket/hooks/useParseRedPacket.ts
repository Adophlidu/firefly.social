import { useQuery } from '@tanstack/react-query';
import { compact, first } from 'lodash-es';

import { RedPacketMetaKey, SolanaRedPacketMetaKey } from '@/constants/rp.js';
import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { useProfileStore } from '@/hooks/useProfileStore.js';
import { logger } from '@/libs/Logger.js';
import { parse } from '@/providers/firefly/red-packet/parse.js';
import { type Post } from '@/providers/types/SocialMedia.js';

/**
 * Parse RedPacket with post info.
 * With `account`, would parse and check the availability.
 * Without `account`, would only parse.
 */
export function useParseRedPacket(account: string | undefined, post: Post, enabled = true) {
    const source = post.source;
    const { currentProfile } = useProfileStore(source);
    const image = first(
        compact(post.metadata.content?.attachments?.filter((x) => x.type === 'Image').map((x) => x.uri)),
    );

    const { data, refetch, isLoading } = useQuery({
        enabled,
        staleTime: 1000 * 60 * 10, // 10 minutes
        queryKey: ['red-packet', 'parse', source, image, account?.toLowerCase(), currentProfile?.profileId],
        queryFn: async () => {
            if (!image) return null;

            try {
                return await parse({
                    image: {
                        imageUrl: image,
                    },
                    walletAddress: account,
                    platform: resolveRedPacketPlatformType(source),
                    profileId: currentProfile?.profileId,
                });
            } catch (error) {
                logger.error('useParseRedPacket', 'Failed to parse red packet', { error, source, image, account });
                return null;
            }
        },
    });

    const metadata = data?.redpacket?.payload || data?.meta[RedPacketMetaKey] || data?.meta[SolanaRedPacketMetaKey];

    return { parsed: data, payloadImage: metadata ? image : undefined, metadata, isLoading, refetch };
}
