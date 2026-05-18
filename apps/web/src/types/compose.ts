import type { BlobRef } from '@atproto/api';
import type { SocialSource } from '@dimensiondev/enums';

import type { RestrictionType } from '@/constants/enum.js';
import type { CompositePoll } from '@/providers/types/Poll.js';
import type { Channel, Post } from '@/providers/types/SocialMedia.js';
import type { Chars } from '@/types/chars.js';
import type { Frame } from '@/types/frame.js';
import type { OpenGraph } from '@/types/og.js';
import type { RedPacketPayload } from '@/types/rp.js';

export enum MediaSource {
    Local = 'local',
    Twimg = 'Twimg',
    IPFS = 'ipfs',
    Imgur = 'imgur',
    S3 = 's3',
    Giphy = 'giphy',
    Tenor = 'tenor',
    Host = 'host',
}

export interface MediaObject {
    id: string;
    file: File;
    mimeType: string;
    urls?: Partial<Record<MediaSource, string>>;
    uploadIds?: Partial<Record<MediaSource, string>>;
    isRpPayloadImage?: boolean;
    // For bsky
    blobRef?: BlobRef;
    width?: number;
    height?: number;
    duration?: number;
    thumb?: string;
}

export interface VideoMetadata {
    duration: number;
    width: number;
    height: number;
}

export type ComposeType = 'compose' | 'quote' | 'reply';

// A recursive version of Post will cause typescript failed to infer the type of the final exports.
export type OrphanPost = Omit<
    Post,
    'embedPosts' | 'comments' | 'root' | 'commentOn' | 'quoteOn' | 'firstComment' | 'threads'
>;

// A composite post uses availableSources of the root post.
export interface CompositePost {
    id: string;

    // tracking the post id in specific platform if it's posted
    postId: Record<SocialSource, string | null>;
    postContentURI: Record<SocialSource, string | null>;
    // tracking the parent post in specific platform (runtime only)
    parentPost: Record<SocialSource, OrphanPost | null>;
    // tracking error
    postError: Record<SocialSource, Error | null>;

    // shared properties
    chars: Chars;
    restriction: RestrictionType;
    availableSources: SocialSource[];
    channel: Record<SocialSource, Channel | null>;
    // Anonymous post
    isAnonymous: boolean;

    // media objects
    videos: MediaObject[];
    images: MediaObject[];
    urls: string[];
    poll: CompositePoll | null;
    rpPayload: RedPacketPayload | null;
    // parsed frames from urls in chars
    frames: Frame[];
    // parsed open graphs from url in chars
    openGraphs: OpenGraph[];

    excludeReplyProfileIds?: string[];
}

export interface PostFunctionParams {
    type: ComposeType;
    compositePost: CompositePost;
    // keep CharTag.POST_LINK in readChars
    keepPostLinks?: boolean;
    signal?: AbortSignal;
}
