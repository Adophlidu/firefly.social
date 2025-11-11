/* cspell:disable */

import type { FrameProtocol } from '@/constants/enum.js';
import type { LiteralOrString } from '@/types/utility.js';

// #region frame v1
export type Index = 1 | 2 | 3 | 4;

export enum ActionType {
    Post = 'post',
    PostRedirect = 'post_redirect',
    Link = 'link',
    Mint = 'mint',
    Transaction = 'tx',
}

export interface FrameInput {
    label: string;
    placeholder?: string;
}

export interface FrameButton {
    index: Index;
    text: string;
    action: ActionType;
    // action target URL
    target?: string;
    // send signature packet to, overrides fc:frame:post_url
    postUrl?: string;
}

interface FrameImage {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
}

export interface FrameV1 {
    x_version: 1;
    // frame URL
    url: string;
    // frame title
    title: string;
    // fc:frame
    version: 'vNext';
    // fc:frame:image or og:image
    image: FrameImage;
    // fc:frame:post_url
    postUrl: string;
    // fc:frame:input:text
    input: FrameInput | null;
    // fc:frame:button:$idx and fc:frame:button:$idx:action
    buttons: FrameButton[];
    // fc:frame:refresh_period
    refreshPeriod: number;
    // fc:frame:aspect_ratio
    aspectRatio?: '1.91:1' | '1:1';
    // fc:frame:state
    state?: string;
    // frame client protocol
    protocol?: FrameProtocol;
}

/**
 * Supported chain IDs by Frame
 * Learn more: https://docs.farcaster.xyz/developers/frames/spec
 */
export enum ChainId {
    Ethereum = 1,
    Polygon = 137,
    Arbitrum = 42161,
    Base = 8453,
    Base_Sepolia = 84532,
    Gnosis = 100,
    Optimism = 10,
    Zora = 7777777,
}

export enum MethodType {
    ETH_SEND_TRANSACTION = 'eth_sendTransaction',
    ETH_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
}

export interface RedirectUrlResponse {
    redirectUrl: string;
}
// #endregion

// #region frame v2
interface FrameConfig {
    /**
     * In spec it must be '1', but we allow any string for flexibility
     */
    version: string;
    /**
     * Max length 32 characters
     */
    name: string;
    /**
     * Max length 1024 characters
     */
    homeUrl: string;
    /**
     * Max length 1024 characters. Image must be 1024x1024px PNG, no alpha (not enforceable in TypeScript)
     */
    iconUrl: string;
    /**
     * [DEPRECATED] Max length 1024 characters. Image must be 3:2 aspect ratio (not enforceable in TypeScript)
     */
    imageUrl?: string;
    /**
     * [DEPRECATED] Max length 32 characters
     */
    buttonTitle?: string;
    /**
     * Max length 1024 characters. Must be 200x200px (not enforceable in TypeScript)
     */
    splashImageUrl?: string;
    /**
     * Hex color code
     */
    splashBackgroundColor?: string;
    /**
     * Max length 1024 characters. Must be set if notifications are used (not enforceable in TypeScript)
     */
    webhookUrl?: string;
    /**
     * Max 30 characters, no emojis or special characters (basic enforcement)
     */
    subtitle?: string;
    /**
     * Max 170 characters, no emojis or special characters (basic enforcement)
     */
    description?: string;
    /**
     * Max 3 screenshots. Each should be 1284x2778 portrait (not enforceable in TypeScript)
     */
    screenshotUrls?: string[];
    /**
     * Primary category
     */
    primaryCategory?:
        | 'games'
        | 'social'
        | 'finance'
        | 'utility'
        | 'productivity'
        | 'health-fitness'
        | 'news-media'
        | 'music'
        | 'shopping'
        | 'education'
        | 'developer-tools'
        | 'entertainment'
        | 'art-creativity';
    /**
     * Max 5 tags. Each tag: Lowercase, no spaces, no special characters, no emojis, max 20 characters
     */
    tags?: string[];
    /**
     * 1200 x 630px (1.91:1) (not enforceable in TypeScript)
     */
    heroImageUrl?: string;
    /**
     * Max 30 characters
     */
    tagline?: string;
    /**
     * Max 30 characters
     */
    ogTitle?: string;
    /**
     * Max 100 characters
     */
    ogDescription?: string;
    /**
     * 1200 x 630px (1.91:1) PNG (not enforceable in TypeScript)
     */
    ogImageUrl?: string;
    /**
     * true to exclude from search results, false to include (default)
     */
    noindex?: boolean;
    /**
     * Only chains listed in chainList are supported (not enforceable in TypeScript)
     */
    requiredChains?: string[];
    /**
     * Each entry must be a path to an SDK method (not enforceable in TypeScript)
     */
    requiredCapabilities?: string[];
}

interface FarcasterManifest {
    // Metadata associating the domain with a Farcaster account
    accountAssociation?: {
        // base64url encoded JFS header.
        // See FIP: JSON Farcaster Signatures for details on this format.
        header: string;

        // base64url encoded payload containing a single property `domain`
        payload: string;

        // base64url encoded signature bytes
        signature: string;
    };

    // Frame configuration
    frame: FrameConfig;
}

/**
 * The embedded frame configuration.
 */
export interface FrameV2 {
    x_url: string;
    x_version: 2;
    x_manifest?: FarcasterManifest | null;

    // Frame spec version. Required.
    // Example: "next"
    version: LiteralOrString<'next'>;

    // Frame image.
    // Max 512 characters.
    // Image must be 3:2 aspect ratio and less than 10 MB.
    // Example: "https://yoink.party/img/start.png"
    imageUrl: string;

    // Button attributes
    button: {
        // Button text.
        // Max length of 32 characters.
        // Example: "Yoink Flag"
        title: string;

        // Action attributes
        action: {
            // Action type. Must be "launch_frame".
            type: 'launch_frame';

            // App name
            // Max length of 32 characters.
            // Example: "Yoink!"
            name: string;

            // Frame launch URL.
            // Max 512 characters.
            // Example: "https://yoink.party/"
            url: string;

            // Splash image URL.
            // Max 512 characters.
            // Image must be 200x200px and less than 1MB.
            // Example: "https://yoink.party/img/splash.png"
            splashImageUrl: string;

            // Hex color code.
            // Example: "#eeeee4"
            splashBackgroundColor: string;
        };
    };
}
// #endregion

export type Frame = FrameV1 | FrameV2;

export interface LinkDigestedResponse<T = Frame> {
    frame: T | null;
}

export type IframeBlockerResponse = {
    url: string;
    isBlocked: boolean;
    contentSecurityPolicy?: string;
};
