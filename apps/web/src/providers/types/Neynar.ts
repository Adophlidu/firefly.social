import type { FarcasterNetwork } from '@dimensiondev/enums';
import type { Hex } from 'viem';

import type { ProfileStatus } from '@/providers/types/SocialMedia.js';

export type NeynarResponse<T> =
    | {
          code: string;
          message: string;
          property: string;
          status: number;
      }
    | T;

export enum NeynarProStatus {
    Subscribed = 'subscribed',
    Unsubscribed = 'unsubscribed',
}

export interface CastResponse {
    hash: {
        data: number[];
        type: 'Buffer';
    };
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

export interface SignaturePacket {
    signer: Hex;
    messageHash: Hex;
    messageSignature: Hex;
}

export interface FrameSignaturePacket {
    untrustedData: {
        fid: number;
        url: string;
        messageHash: string;
        timestamp: number;
        network: FarcasterNetwork;
        buttonIndex: number;
        inputText?: string;
        transactionId?: string;
        castId: {
            fid: number;
            hash: string;
        };
        state?: string;
    };
    trustedData: {
        messageBytes: string;
    };
}
