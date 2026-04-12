import { Source } from '@/constants/enum.js';
import type { ExploreClubsResponse } from '@/providers/orb/type.js';
import type { Channel, Profile } from '@/providers/types/SocialMedia.js';

type OrbClub = ExploreClubsResponse['data']['clubs'][number];

export interface WorkerClub {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    followerCount: number;
    timestamp: number;
    ownerId?: string;
}

export function formatChannelFromOrb(club: OrbClub | WorkerClub, owner?: Profile, overrideOwnerId?: string): Channel {
    if ('imageUrl' in club) {
        return {
            source: Source.Lens,
            id: club.id,
            name: club.name,
            description: club.description,
            imageUrl: club.imageUrl,
            url: '',
            parentUrl: '',
            followerCount: club.followerCount,
            timestamp: club.timestamp,
            ownerId: overrideOwnerId ?? club.ownerId,
            lead: owner,
            __original__: club,
        } satisfies Channel;
    }

    return {
        source: Source.Lens,
        id: club.metadata?.address || club.id || '',
        name: club.metadata?.name || '',
        description: club.metadata?.description || '',
        imageUrl: club.metadata?.picture || '',
        url: '',
        parentUrl: '',
        followerCount: club.stats?.totalMembers ?? 0,
        timestamp: club.stats?.timeCreated ?? 0,
        ownerId: overrideOwnerId ?? club.metadata?.ownedBy,
        lead: owner,
        __original__: club,
    } satisfies Channel;
}
