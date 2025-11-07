interface ErrorResponse {
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

interface Next {
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
