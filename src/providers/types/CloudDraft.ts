import type { SocialSourceInURL } from '@/constants/enum.js';

export enum CloudDraftType {
    MainPost = 'main_compose',
    TwitterComment = 'twitter_reply',
    TwitterQuote = 'twitter_quote',
    LensComment = 'lens_comment',
    LensQuote = 'lens_quote',
    FarcasterComment = 'farcaster_comment',
    FarcasterQuote = 'farcaster_quote',
    FarcasterComposeIntent = 'farcaster_compose_intent',
}

export type CloudDraftSource = 'android' | 'ios' | 'web';

export interface CloudDraftContent {
    text: string;
    hasMedia: boolean;
    mentions: Array<{
        text: string;
        platform: Array<{
            uid: string;
            platform: SocialSourceInURL;
            handle: string;
        }>;
    }>;
    rpid?: string;
    poll?: {
        options: string[];
        duration: number;
    };
}

export interface CloudDraftChannel {
    id: string;
    name: string;
    description: string;
    image_url: string;
    created_at: number;
    follower_count: number;
}

export interface CreateCloudDraftRequest {
    id: string;
    version?: number;
    client: CloudDraftSource;
    has_media?: boolean;
    last_update_time: number;
    type: {
        type: CloudDraftType;
        id?: string;
    };
    platform: Array<{ uid: string; platform: SocialSourceInURL }>;
    content: CloudDraftContent[];
    twitter_visibility?: number;
    farcaster_channel?: CloudDraftChannel;
    send_time?: number; // for scheduled posts, timestamp in milliseconds
}

export interface CreateCloudDraftResponse {
    draft_id: string;
    account_raw_id: number;
    version: number;
    has_media: boolean;
    last_update_time: number;
}

export interface CloudDraft {
    draft_id: string;
    account_raw_id: number;
    version: number;
    has_media: boolean;
    last_update_time: number;
    platform: CloudDraftSource;
    raw_json: CreateCloudDraftRequest;
    created_at: string;
    updated_at: string;
}
