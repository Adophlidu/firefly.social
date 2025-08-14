export interface ErrorResponse {
    errors: Array<{
        message: string;
        reason?: string;
    }>;
}

export interface SignedKeyRequestResponse extends ErrorResponse {
    result: {
        signedKeyRequest: {
            deeplinkUrl: string;
            // state of the request taking one of the following values:
            // - pending - no action has been taken by the user
            // - approved - user has approved the request, an onchain transaction is being broadcast and confirmed
            // - completed - the onchain transaction has completed
            state: 'pending' | 'approved' | 'completed';
            // requested key to add
            key: string;
            keyType?: string;
            requestFid: number;
            token: string;
            userFid: number;
            isSponsored: boolean;
        };
    };
}

export interface Cast {
    hash: string;
    parentHash: string;
    parentAuthor: Author;
    castType?: string;
    embeds?: {
        images?: Array<{
            type: string;
            sourceUrl: string;
            url: string;
            alt: string;
        }>;
        processedCastText: string;
        unknowns: unknown[];
        urls: Array<{
            type: string;
            openGraph: {
                description: string;
                domain: string;
                image: string;
                logo: string;
                sourceUrl: string;
                title: StaticRange;
                url: string;
                userLargeImage: boolean;
            };
        }>;
        videos?: Array<{
            url: string;
            type: string;
        }>;
    };
    mentions?: Author[];
    threadHash: string;
    author: Author;
    text: string;
    timestamp: number;
    replies: Replies;
    reactions: Reactions;
    recasts: Recasts;
    watches: Watches;
    recast: boolean;
    viewerContext: ViewerContext;
}

export interface Author {
    fid: number;
    username: string;
    displayName: string;
    pfp?: Pfp;
    followerCount: number;
    followingCount: number;
    profile: {
        bio: {
            mention: string[];
            text: string;
        };
        location: {
            description: string;
            placeId: string;
        };
        username: string;
    };
}

export interface Pfp {
    url: string;
    verified: boolean;
}

export interface Replies {
    count: number;
}

export interface Reactions {
    count: number;
}

export interface Recasts {
    count: number;
    recasters: Recaster[];
}

export interface Recaster {
    fid: number;
    username: string;
    displayName: string;
}

export interface Watches {
    count: number;
}

export interface ViewerContext {
    reacted: boolean;
    recast: boolean;
    watched: boolean;
}

export interface Next {
    cursor: string;
}

export interface Channel {
    id: string;
    url: string;
    name: string;
    description: string;
    descriptionMentions: number[];
    descriptionMentionsPositions: number[];
    imageUrl: string;
    headerImageUrl: string;
    leadFid?: number;
    moderatorFids?: number[];
    createdAt: number;
    followerCount: number;
    memberCount: number;
    pinnedCastHash?: string;
    publicCasting?: boolean;
    externalLink?: {
        title: string;
        url: string;
    };
}

export interface ChannelFollowersResponse extends ErrorResponse {
    result: {
        users: Array<{
            fid: number;
            followedAt: number;
        }>;
    };
    next?: Next;
}

export interface ChannelMembersResponse extends ErrorResponse {
    result: {
        members: Array<{
            fid: number;
            memberAt: number;
        }>;
    };
    next?: Next;
}
