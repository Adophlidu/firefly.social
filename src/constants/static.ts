/* cspell:disable */

import {
    NODE_ENV,
    type RequestedLoginSource,
    type SocialSource,
    Source,
    STATUS,
    VERCEL_ENV,
} from '@/constants/enum.js';
import { env } from '@/constants/env.js';

export const EMPTY_LIST = Object.freeze([]) as never[];
export const EMPTY_OBJECT = Object.freeze({}) as Record<string, never>;

export const SITE_NAME = 'Firefly ✨ Everything App for Web3 Natives';
export const SITE_DESCRIPTION = "Firefly is a social app for exploring what's happening onchain.";
export const SITE_HOSTNAME = 'firefly.social';

const SITE_LOGO =
    'data:image/png;base64,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' as const;

export const FIREFLY_USER_AGENT = 'Mozilla/5.0 (compatible; Firefly/1.0)';
export const SITE_URL_OFFICIAL = 'https://firefly.social';
export const FARCASTER_REPLY_URL = 'https://relay.farcaster.xyz';
export const WARPCAST_ROOT_URL = 'https://api.warpcast.com';
export const WARPCAST_ROOT_URL_V1 = 'https://api.warpcast.com/v1';
export const WARPCAST_ROOT_URL_V2 = 'https://api.warpcast.com/v2';
export const FIREFLY_ROOT_URL = 'https://api.firefly.land';
export const FIREFLY_ROOT_URL_DEV = 'https://api-dev.firefly.land';
export const FIREFLY_S3_URL = 'https://media.firefly.land';
export const FIREFLY_STAMP_URL = 'https://stamp.firefly.land/avatar';
export const FIREFLY_STAMP_DEV_URL = 'https://stamp-dev.firefly.land/avatar';
export const HEY_IPFS_GW_URL = 'https://gw.ipfs-lens.dev/ipfs';
export const FIREFLY_WORKER_HOST = 'https://firefly.r2d2.to';
export const COINGECKO_ROOT_URL = 'https://coingecko-agent.r2d2.to/api/v3';
export const GO_PLUS_LABS_ROOT_URL = 'https://gopluslabs.r2d2.to';
export const DEBANK_OPEN_API = 'https://debank-proxy.r2d2.to';
export const TWITTER_UPLOAD_MEDIA_URL = 'https://upload.twitter.com/1.1/media/upload.json';
export const SNAPSHOT_SEQ_URL = 'https://seq.snapshot.org';
export const SNAPSHOT_RELAY_URL = 'https://relayer.snapshot.org';
export const SNAPSHOT_IPFS_GATEWAY_URL = 'https://snapshot.4everland.link/ipfs/';
export const FIREFLY_TELEGRAM_URL = 'https://t.me/fireflyapp';
export const BSKY_VIDEO_ENDPOINT = 'https://video.bsky.app/xrpc';
export const NEYNAR_URL = 'https://neynar-proxy.r2d2.to';
export const FIREFLY_NITTER_URL = 'https://nitter.r2d2.to';
export const ORB_API_URL = 'https://orbapi.xyz';
export const CALENDAR_BASE_URL = 'https://mask-network-dev.firefly.land/v1/calendar/';
export const ACCOUNT_CONFLICT_SOLUTION_URL =
    'https://mask.notion.site/Experience-a-login-conflict-2227d90fdc9b819cabffe6a98d87f901';
export const ACCOUNT_CONFLICT_SOLUTION_ZH_URL = 'https://mask.notion.site/2327d90fdc9b80c8aba6e217343b304b';
export const FARCASTER_POLL_MINI_APP_URL = 'https://polls-miniapps.firefly.social';
export const FARCASTER_POLL_MINI_APP_URL_DEV = 'https://polls-miniapps-staging.firefly.social';
export const X_WEBHOOK_RECEIVER_URL = 'https://x-webhook-receiver.r2d2.to';
export const FIREFLY_EXCEPTION_TRACKER_URL = 'https://firefly-exception-tracker.r2d2.to';

export const FARCASTER_REPLY_COUNTDOWN = 50; // in seconds
export const ORB_REPLY_COUNTDOWN = 60; // in seconds

export const RP_HASH_TAG = '#FireflyLuckyDrop';

export const HIDDEN_SECRET = '[HIDE_FROM_CLIENT]';
export const NOT_DEPEND_SECRET = '[TO_BE_REPLACED_LATER]';

// Lens
export const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
export const ARWEAVE_GATEWAY = 'https://arweave.net/';
export const LENS_MEDIA_SNAPSHOT_URL = 'https://ik.imagekit.io/lens/media-snapshot';
export const HEY_IMAGEKIT_URL = 'https://ik.imagekit.io/lensterimg';
export const LENS_CHAIN_ID = 232;
// TODO: create lens app for firefly
export const FIREFLY_LENS_V3_APP = '0xaC19aa2402b3AC3f9Fe471D4783EC68595432465';

// Named transforms for ImageKit
export const IMAGE_KIT_AVATAR = 'tr:w-300,h-300';
export const IMAGE_KIT_COVER = 'tr:w-1500,h-500';
export const IMAGE_KIT_ATTACHMENT = 'tr:w-1000';

// polls
export const FRAME_SERVER_URL = 'https://polls.firefly.social';
export const FRAME_DEV_SERVER_URL = 'https://polls-staging.firefly.social';

// HTTP Cache headers
export const CACHE_AGE_INDEFINITE_ON_DISK = 'public, s-maxage=31536000, max-age=31536000, must-revalidate';

// Search Bar
export const MAX_SEARCH_RECORD_SIZE = 5;
export const MAX_RECOMMEND_PROFILE_SIZE = 6;

// POST
export const MAX_FRAME_SIZE_PER_POST = 1;
export const MIN_CHAR_LENGTH_TO_TRANSLATE = 3;
export const MIN_POST_SIZE_PER_THREAD = 3;

export const MAX_ACCOUNT_COUNT_PER_SOURCE = 3;

// Contracts
export const POAP_CONTRACT_ADDRESS = '0x22C1f6050E56d2876009903609a2cC3fEf83B415';

export const NOTIFICATION_PERMISSION_KEY = 'notification-permission';

export const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

export const MAX_SIZE_PER_CHUNK = 2 * 1024 * 1024; // 2MB

export const VITALIK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';

export const METRICS_PASSWORD_LENGTH = 6;
export const SESSION_PASSWORD_INPUT_ID = 'session-password-input';

export const BSKY_LOGIN_REQUIRED_FEEDS = [
    'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends',
    'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/mutuals',
];

/** coingecko coin ids that are not solana or ethereum */
export const NO_TRACING_COINS = [
    'bitcoin',
    'bitcoin-cash',
    'bittensor',
    'dogecoin',
    'tron',
    'cardano',
    'sui',
    'polkadot',
    'hyperliquid',
    'litecoin',
    'stellar',
    'ripple', // xrp
    'hedera-hashgraph',
    'gxchain',
    'thala-apt',
];
export const COINGECKO_SOL_COIN_ID = 'solana';
export const SWAP_SOL_NATIVE_ADDRESS = '11111111111111111111111111111111';

export const SIGNUP_AUDIO_ID = 'signup-audio';

export const EIP6963_PROVIDER_DESCRIPTION = {
    name: SITE_NAME,
    icon: SITE_LOGO,
    rdns: 'social.firefly.frameHost',
    uuid: 'a2ed942a-3e45-4bef-907d-22700a5315d6',
};

export const EVENT_ROUTES: Array<`/${string}`> = ['/event', '/events'];
export const INTERNAL_ROUTES: Array<`/${string}`> = ['/frame', '/login', '/redirect', '/telegram'];
export const WHITEBOARD_ROUTES: Array<`/${string}`> = [...INTERNAL_ROUTES, '/signup'];

// Environment-based constants
export const SITE_URL = env.external.NEXT_PUBLIC_SITE_URL ?? SITE_URL_OFFICIAL;

export const NFT_ENABLED = env.external.NEXT_PUBLIC_NFT_FEATURES === STATUS.Enabled;

export const IS_PRODUCTION = env.external.NEXT_PUBLIC_VERCEL_ENV === VERCEL_ENV.Production;
export const IS_DEVELOPMENT = env.external.NEXT_PUBLIC_VERCEL_ENV === VERCEL_ENV.Development;
export const IS_PREVIEW = env.external.NEXT_PUBLIC_VERCEL_ENV === VERCEL_ENV.Preview;

export const MAX_POST_SIZE_PER_THREAD = env.shared.NODE_ENV === NODE_ENV.Development ? 10 : 25;

export const REQUIRE_LOGIN_SOURCES: RequestedLoginSource[] =
    env.external.NEXT_PUBLIC_NITTER === STATUS.Enabled ? [] : [Source.Twitter];
export const REQUIRE_LOGIN_SOURCES_IN_SEARCH: SocialSource[] =
    env.external.NEXT_PUBLIC_NITTER === STATUS.Enabled ? [Source.Bsky] : [Source.Twitter, Source.Bsky];
