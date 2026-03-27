export const TCO_URL_REGEX = /(https?:\/\/)?t\.co\/[a-zA-Z0-9]+/g;
export const URL_REGEX =
    /((https?:\/\/)?[a-zA-Z0-9]+([-.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}(:[0-9]{1,5})?([/?](?:[^ \n,)>]+|,[^ \n)>]+)*)?)/gi;

export const URL_INPUT_REGEX = new RegExp(`^${URL_REGEX.source.replace('(https?:\\/\\/)?', '(https?:\\/\\/)')}$`);

export const EMAIL_REGEX =
    /(([^\s"(),.:;<>@[\\\]/]+(\.[^\s"(),.:;<>@[\\\]/]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/;

export const LITE_EMAIL_REGEX = /^[\w.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

export const MENTION_REGEX = /@[\w-]+(?:(?:\.[\w-]+)+|(?:\/[\w-]+)+|\.?)/g;
export const TWITTER_MENTION_REGEX = /@([A-Za-z0-9_]{1,15})/g;
export const BSKY_MENTION_REGEX = /@([a-zA-Z0-9.-]+)/g;
export const LENS_MENTION_REGEX = /@(?:lens\/[^\s/@]+|[^\s/@]+\.lens)/gi;
export const FARCASTER_MENTION_REGEX = /@(([a-zA-Z0-9_-]{1,256}\.)+eth|[^\s()@:%+~#?&=,!?'.]+)/g;
export const LENS_USERNAME_REGEXP = /^[\dA-Za-z]\w{4,25}$/g; // from hey
export const FARCASTER_USERNAME_REGEXP = /^[a-z0-9][a-z0-9-]{0,15}$/; // same as signup on farcaster mobile app

/** Financial symbol */
export const SYMBOL_REGEX = /(^|\s)(\$([a-zA-Z0-9]|\p{Script=Han})+)/gu;
export const EVM_ADDRESS = /\b(0x[a-fA-F0-9]{40})\b/gu;
export const SOLANA_ADDRESS = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/gu;
export const EXIST_EVM_ADDRESS = /\b(0x[a-fA-F0-9]{40})\b/gu;
export const EXIST_SOLANA_ADDRESS = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/gu;

// for safari does not support negative lookbehind
// since we cannot eliminate the space before the channel, we will trim it later
export const CHANNEL_REGEX = /(^|\s)\/[a-z0-9][a-z0-9-]*($|(?![0-9a-zA-Z/]))/g;

export const MIRROR_HOSTNAME_REGEXP = /mirror\.xyz|.+\.mirror\.xyz/i;

export const FARCASTER_DETAIL_REGEX = /^https:\/\/farcaster\.xyz\/([^/]+)\/(0x[a-fA-F0-9]+)$/;

export const FARCASTER_TOKEN_PATH_RE = /^\/~\/c\/([^:]+):(0x[a-fA-F0-9]{40})$/;

export const BIO_TWITTER_PROFILE_REGEX = /([^\s]+)\.twitter/;
// cspell: disable-next-line
export const TWITTER_NORMAL_AVATAR = /^https:\/\/pbs\.twimg\.com.*_normal(\.\w+)$/;

export const NUMBER_STRING_REGEX = /^[0-9\s+-,]+$/m;

export const TWEET_REGEX = /https:\/\/(x\.com|twitter\.com)\/([a-zA-Z0-9_]*)\/status\/(\d+)/;

// https://www.lens.xyz/docs/best-practices/onboarding#choosing-a-handle
export const LENS_HANDLE_REGEXP = /^[a-zA-Z_][a-zA-Z0-9_]{2,26}\.lens$/;

export const ENS_REGEXP = /(^|\s)(([a-zA-Z0-9_-]{1,256}\.)+eth)\b/g;
export const FULL_ENS_REGEXP = /^(([a-zA-Z0-9_-]{1,256}\.)+(eth|base\.eth|sol|skr))$/;

export const NUMERIC_INPUT_REGEXP_PATTERN = '^[1-9]|^0(?![0-9])[.,。]?[0-9]*$';

// cspell: disable-next-line
export const LIMO_REGEXP = /^https:\/\/vitalik\.eth\.limo\/general\//;

export const MIRROR_ARTICLE_REGEXP = /https?:\/\/mirror\.xyz\/[^/]+\/([^/]+)/;
export const MIRROR_SUBDOMAIN_ARTICLE_REGEXP = /^https:\/\/.*\.mirror\.xyz\/(.*)$/;
export const PARAGRAPH_ARTICLE_REGEXP = /https?:\/\/paragraph\.xyz(\/view)?\/@([^/]+)\/(.+)/;

export const TENOR_GIF_REGEXP = /^https:\/\/media\.tenor\.com\/([^/]+)\/([^/]+)\.gif/;

export const IPFS_REGEXP =
    /ipfs:\/\/(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[2-7A-Za-z]{58,}|B[2-7A-Z]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[\\dA-F]{50,})/;

export const FIREFLY_DISPLAY_NAME_REGEXP = /^(?!\s*$).+/;

export const SPECIAL_TOKEN_SYMBOLS = ['the network state'];
export const SPECIAL_TOKEN_SYMBOLS_REGEX = new RegExp(`\\b(${SPECIAL_TOKEN_SYMBOLS.join('|')})\\b`, 'i');

// From x api error message: "The `query` query parameter value [x] does not match ^[A-Za-z0-9_' ]{1,50}$ (code: undefined)"
export const TWITTER_PROFILE_SEARCH_REGEXP = /^[A-Za-z0-9_' ]{1,50}$/;

/* cspell:ignore youtu */
export const YOUTUBE_URL_REGEX = /^https?:\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w-]+)(?:\?.*)?$/;
export const YOUTUBE_SHORT_URL_REGEX = /^https?:\/\/(?:www\.)?youtu(?:be\.com\/shorts\/|\.be\/)([\w-]+)(?:\?.*)?$/;

export const TWITTER_ARTICLE_REGEX = /^https?:\/\/(x|twitter)\.com\/i\/article\/\d+$/;

// Search URL detection patterns
export const ORB_POST_REGEX = /^\/p\/([^/?]+)/;
export const ORB_PROFILE_REGEX = /^\/@([^/?]+)/;
export const HEY_POST_REGEX = /^\/posts\/([^/?]+)/;
export const HEY_PROFILE_REGEX = /^\/u\/([^/?]+)/;
export const POLYMARKET_EVENT_REGEX = /^\/event\/([^/?]+)/;
export const X_PROFILE_REGEX = /^\/([A-Za-z0-9_]{1,15})\/?$/;
export const FARCASTER_PROFILE_REGEX = /^\/([^/]+)\/?$/;
