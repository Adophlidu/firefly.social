import { Source } from '@/constants/enum.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import type { ORBExploreClubsResponse } from '@/providers/orb/type.js';
import type { Channel, Profile } from '@/providers/types/SocialMedia.js';

type OrbClub = ORBExploreClubsResponse['data']['clubs'][number];

export function formatChannelFromOrb(club: OrbClub, owners?: Profile[]): Channel {
    const createdAt = club.stats?.timeCreated ?? 0;
    const ownerId = club.metadata?.ownedBy;

    return {
        source: Source.Lens,
        id: club.metadata?.address || club.id || '',
        name: club.metadata?.name || '',
        description: club.metadata?.description || '',
        imageUrl: club.metadata?.picture || '',
        url: '',
        parentUrl: '',
        followerCount: club.stats?.totalMembers ?? 0,
        timestamp: createdAt,
        ownerId,
        lead:
            ownerId && owners ? owners.find((profile) => isSameEthereumAddress(profile.profileId, ownerId)) : undefined,
        __original__: club,
    } satisfies Channel;
}
