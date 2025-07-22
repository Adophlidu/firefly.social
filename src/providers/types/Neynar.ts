import type { ProfileStatus } from '@/providers/types/SocialMedia.js';

export enum NeynarProStatus {
    Subscribed = 'subscribed',
    Unsubscribed = 'unsubscribed',
}

export interface Profile {
    object: string;
    fid: number;
    custody_address: string;
    username: string;
    display_name: string;
    pfp_url: string;
    profile: {
        bio: {
            text: string;
            mentioned_profiles: Array<{
                username: string;
                pfp_url: string;
                fid: number;
                object: string;
                display_name: string;
                custody_address: string;
            }>;
            mentioned_channels: Array<{
                id: string;
                image_url: string;
                name: string;
                object: string;
            }>;
        };
    };
    viewer_context?: {
        following: boolean;
        followed_by: boolean;
    };
    follower_count: number;
    following_count: number;
    verifications: string[];
    verified_addresses: {
        eth_addresses: string[];
        sol_addresses: string[];
    };
    active_status: ProfileStatus;
    power_badge: boolean;
    pro?: {
        status: NeynarProStatus;
        /** @example "2023-11-07T05:31:56Z" */
        subscribed_at: string;
        /** @example "2023-11-07T05:31:56Z" */
        expires_at: string;
    };
}

export interface Channel {
    id: string;
    url: string;
    name: string;
    description: string;
    object: string;
    created_at: number;
    follower_count: number;
    external_link: {
        title: string;
        url: string;
    };
    image_url: string;
    parent_url: string;
    lead?: Profile;
    moderator_fids: number[];
    member_count: number;
    pinned_cast_hash?: string;
    viewer_context?: {
        following: boolean;
        role: 'moderator' | 'member' | 'none';
    };
}
