export interface OrbClub {
    type: string;
    id: string;
    metadata?: {
        name?: string;
        handle?: string;
        address?: string;
        ownedBy?: string;
        description?: string;
        picture?: string;
        cover?: string;
    };
    stats?: {
        totalMembers?: number;
        timeCreated?: number;
    };
}

export interface ExploreClubsData {
    clubs: OrbClub[];
    pageInfo?: {
        total?: number;
        hasMore?: boolean;
        next?: string | null;
        prev?: string | null;
    };
}

export interface LensGroupData {
    address: string;
    ownerId?: string;
    memberCount?: number;
}

export interface ChannelWithOwner {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    followerCount: number;
    timestamp: number;
    ownerId?: string;
}

export interface TrendingClubsResponse {
    clubs: ChannelWithOwner[];
    pageInfo?: {
        hasMore?: boolean;
        next?: string | null;
    };
}
