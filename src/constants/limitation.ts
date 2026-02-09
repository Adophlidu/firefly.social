import { type SocialSource, Source } from '@/constants/enum.js';

type Limitation = Record<SocialSource, number>;

export const MAX_CHAR_SIZE_PER_POST: Limitation = {
    [Source.Farcaster]: 1024,
    [Source.Lens]: 5000,
    [Source.Twitter]: 280,
    [Source.Bsky]: 5000,
};

/**
 * Bsky short post character limit
 * Posts within this limit can be posted directly to Bsky
 * Posts exceeding this limit will be stored as Firefly articles with truncated preview
 */
export const BSKY_SHORT_POST_LIMIT = 300;

export const MAX_CHAR_SIZE_VERIFY_PER_POST: Limitation = {
    [Source.Farcaster]: 1024,
    [Source.Lens]: 5000,
    [Source.Twitter]: 25000,
    [Source.Bsky]: 5000,
};

export const MAX_CHAR_SIZE_PRO_PER_POST: Limitation = {
    [Source.Farcaster]: 10_000,
    [Source.Lens]: MAX_CHAR_SIZE_VERIFY_PER_POST[Source.Lens],
    [Source.Twitter]: MAX_CHAR_SIZE_VERIFY_PER_POST[Source.Twitter],
    [Source.Bsky]: MAX_CHAR_SIZE_VERIFY_PER_POST[Source.Bsky],
};

export const MAX_IMAGE_SIZE_PER_POST: Limitation = {
    [Source.Farcaster]: 2,
    [Source.Lens]: 20,
    [Source.Twitter]: 4,
    [Source.Bsky]: 4,
};

export const MAX_IMAGE_SIZE_PRO_PER_POST: Limitation = {
    [Source.Farcaster]: 4,
    [Source.Lens]: MAX_IMAGE_SIZE_PER_POST[Source.Lens],
    [Source.Twitter]: MAX_IMAGE_SIZE_PER_POST[Source.Twitter],
    [Source.Bsky]: MAX_IMAGE_SIZE_PER_POST[Source.Bsky],
};

export const MAX_VIDEO_SIZE_PER_POST: Limitation = {
    [Source.Farcaster]: 1,
    [Source.Lens]: 1,
    [Source.Twitter]: 1,
    [Source.Bsky]: 1,
};

export const MAX_VIDEO_SIZE_PRO_PER_POST: Limitation = {
    [Source.Farcaster]: 4,
    [Source.Lens]: MAX_VIDEO_SIZE_PER_POST[Source.Lens],
    [Source.Twitter]: MAX_VIDEO_SIZE_PER_POST[Source.Twitter],
    [Source.Bsky]: MAX_VIDEO_SIZE_PER_POST[Source.Bsky],
};

export const MAX_GIF_SIZE_PER_POST: Limitation = {
    [Source.Farcaster]: 2,
    [Source.Lens]: 20,
    [Source.Twitter]: 4,
    [Source.Bsky]: 1,
};

export const MAX_GIF_SIZE_PRO_PER_POST: Limitation = {
    [Source.Farcaster]: 4,
    [Source.Lens]: MAX_GIF_SIZE_PER_POST[Source.Lens],
    [Source.Twitter]: MAX_GIF_SIZE_PER_POST[Source.Twitter],
    [Source.Bsky]: MAX_GIF_SIZE_PER_POST[Source.Bsky],
};

export const MAX_FILE_SIZE_PER_IMAGE: Limitation = {
    [Source.Lens]: 100 * 1024 * 1024, // 100MB
    [Source.Farcaster]: 100 * 1024 * 1024, // 100MB
    [Source.Twitter]: 5 * 1024 * 1024, // 5MB
    [Source.Bsky]: 5 * 1024 * 1024, // 5MB
};

export const MAX_FILE_SIZE_PER_GIF: Limitation = {
    [Source.Lens]: 15 * 1024 * 1024, // 15MB
    [Source.Farcaster]: 15 * 1024 * 1024, // 15MB
    [Source.Twitter]: 15 * 1024 * 1024, // 15MB
    [Source.Bsky]: 15 * 1024 * 1024, // 15MB
};

// https://mask.atlassian.net/browse/FW-2212
export const MAX_FILE_SIZE_PER_VIDEO: Limitation = {
    [Source.Lens]: 1024 * 1024 * 1024, // 1GB
    [Source.Farcaster]: 1024 * 1024 * 1024, // 1GB
    [Source.Twitter]: 512 * 1024 * 1024, // 512MB
    // https://github.com/bluesky-social/social-app/blob/main/src/lib/constants.ts
    [Source.Bsky]: 90 * 1024 * 1024, // 90MB
};

export const MIN_DURATION_PER_VIDEO: Limitation = {
    [Source.Lens]: 0,
    [Source.Farcaster]: 0,
    [Source.Twitter]: 0.5,
    [Source.Bsky]: 0.5,
};

export const MAX_DURATION_PER_VIDEO: Limitation = {
    [Source.Lens]: Infinity,
    [Source.Farcaster]: Infinity,
    [Source.Twitter]: Infinity,
    // https://github.com/bluesky-social/social-app/blob/main/src/lib/constants.ts
    [Source.Bsky]: 60 * 3, // 3 minutes
};

export const MIN_WIDTH_PER_VIDEO: Limitation = {
    [Source.Lens]: 0,
    [Source.Farcaster]: 0,
    [Source.Twitter]: 0,
    [Source.Bsky]: 0,
};

export const MAX_WIDTH_PER_VIDEO: Limitation = {
    [Source.Lens]: 4096,
    [Source.Farcaster]: 4096,
    [Source.Twitter]: Infinity,
    [Source.Bsky]: Infinity,
};

export const MIN_HEIGHT_PER_VIDEO: Limitation = {
    [Source.Lens]: 0,
    [Source.Farcaster]: 0,
    [Source.Twitter]: 0,
    [Source.Bsky]: 0,
};

export const MAX_HEIGHT_PER_VIDEO: Limitation = {
    [Source.Lens]: 4096,
    [Source.Farcaster]: 4096,
    [Source.Twitter]: Infinity,
    [Source.Bsky]: Infinity,
};

// update profile
export const MAX_PROFILE_BIO_SIZE: Limitation = {
    [Source.Farcaster]: 160,
    [Source.Lens]: 260,
    [Source.Twitter]: 160,
    [Source.Bsky]: 256,
};

export const MIN_PROFILE_BIO_SIZE: Limitation = {
    [Source.Farcaster]: 0,
    [Source.Lens]: 0,
    [Source.Twitter]: 0,
    [Source.Bsky]: 0,
};

export const MAX_PROFILE_DISPLAY_NAME_SIZE: Limitation = {
    [Source.Farcaster]: 32,
    [Source.Lens]: 100,
    [Source.Twitter]: 50,
    [Source.Bsky]: 64,
};

export const MAX_PROFILE_LOCATION_SIZE: Limitation = {
    [Source.Farcaster]: 0,
    [Source.Lens]: 100,
    [Source.Twitter]: 30,
    [Source.Bsky]: 0,
};

export const MAX_PROFILE_WEBSITE_SIZE: Limitation = {
    [Source.Farcaster]: 0,
    [Source.Lens]: 100,
    [Source.Twitter]: 100,
    [Source.Bsky]: 0,
};

export const MAX_PROFILE_HANDLE_SIZE: Limitation = {
    [Source.Farcaster]: 16,
    [Source.Lens]: 26,
    [Source.Twitter]: -1,
    [Source.Bsky]: -1,
};

export const MIN_PROFILE_HANDLE_SIZE: Limitation = {
    [Source.Farcaster]: 1,
    [Source.Lens]: 5,
    [Source.Twitter]: 1,
    [Source.Bsky]: 1,
};

// https://github.com/bluesky-social/social-app/blob/main/src/lib/constants.ts
export const BSKY_IMAGE_LIMITATION = {
    maxWidth: 2000,
    maxHeight: 2000,
    maxSize: 1000000,
};
