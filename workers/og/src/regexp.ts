export const BSKY_POST_REGEXP = /^https:\/\/bsky\.app\/profile\/([^/]+)\/post\/([a-zA-Z0-9_]+)/;
export const FARCASTER_DETAIL_REGEX = /^https:\/\/farcaster\.xyz\/([^/]+)\/(0x[a-fA-F0-9]+)$/;
export const FIREFLY_DETAIL_REGEX = /^https:\/\/([^/]+\.)?firefly\.social\/post\/([^/]+)\/([a-zA-Z0-9_]+)$/;
export const LENS_DETAIL_REGEX = /^https:\/\/hey\.xyz\/posts\/.*$/;
export const TWEET_REGEX = /https:\/\/(x\.com|twitter\.com)\/([a-zA-Z0-9_]*)\/status\/(\d+)/;
export const TWEET_WEB_REGEX = /https:\/\/(x\.com|twitter\.com)\/i\/web\/status\/(\d+)/;
export const WARPCAST_CONVERSATIONS_REGEX =
    /^https:\/\/(warpcast\.com|farcaster\.xyz)\/~\/conversations\/(0x[a-fA-F0-9]+)?$/;
export const WARPCAST_THREAD_REGEX = /^https:\/\/(warpcast\.com|farcaster\.xyz)\/([a-zA-Z][^/]*)\/(0x[a-fA-F0-9]+)$/;

// https://truthsocial.com/users/realDonaldTrump/statuses/114496851630865496
export const TRUTH_SOCIAL_POST_REGEXP = /https:\/\/truthsocial\.com\/users\/([^/]+)\/statuses\/([a-zA-Z0-9_]+)/;
export const TWEET_SPACE_REGEX = /https:\/\/(x\.com|twitter\.com)\/([a-zA-Z0-9_]*)\/spaces\/([a-zA-Z0-9_]*)/;
export const EVM_ADDRESS = /\b(0x[a-fA-F0-9]{40})\b/gu;

// Polymarket patterns
export const POLYMARKET_PROFILE_USERNAME_REGEX = /^https:\/\/polymarket\.com\/@([^/?#]+)\/?(?:\?.*)?$/;
export const POLYMARKET_PROFILE_WALLET_REGEX = /^https:\/\/polymarket\.com\/profile\/([^/?#]+)\/?(?:\?.*)?$/;
export const POLYMARKET_EVENT_REGEX = /^https:\/\/polymarket\.com\/event\/([^/?#]+)\/?(?:\?.*)?$/;

// Opinion patterns
export const OPINION_PROFILE_REGEX = /^https:\/\/app\.opinion\.trade\/profile\/?\?address=([^&#]+)(?:&.*)?$/;
export const OPINION_EVENT_REGEX =
    /^https:\/\/app\.opinion\.trade\/detail\/?\?topicId=([^&#]+)(?:&type=([^&#]+))?(?:&.*)?$/;
