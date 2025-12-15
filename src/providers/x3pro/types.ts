/* cspell:disable */
export type Response<T> =
    | {
          success: true;
          data: T;
      }
    | {
          success: false;
          error: {
              message: string;
          };
      };

export interface Profile {
    /** path of avatar url */
    avatar: string;
    /** path of background url */
    bk: string;
    ca?: string;
    caCreateTime?: number;
    caPostId?: string;
    /** timestamp in seconds */
    createTime: number;
    fanCount: number;
    focusCount: number;
    homeDisplayUrl?: string;
    homeRealUrl?: string;
    id: string;
    includeTime: number;
    introLinks: Array<{
        displayUrl: string;
        realUrl: string;
        shortUrl: string;
    }> | null;
    introduction: string;
    introductionLang: string;
    isFocus: boolean;
    isMonitor: boolean;
    label: number;
    label2: number;
    monitorCount: number;
    name: string;
    rank: number;
    screenName: string;
    twitterUrl: string;
    verifyType: number;
}

export interface Post {
    author: Profile;
    collectCount: number;
    content: string;
    /** timestamp in seconds */
    createTime: number;
    forwardCount: number;
    hunterRank: unknown | null;
    id: string;
    lang: string;
    likeCount: number;
    /** @todo unknown */
    links: null;
    /** @todo unknown */
    media: Array<{
        contentType: null;
        id: string;
        orderNum: 0;
        originUrl: null;
        /** path of origin media url */
        path: string;
        type: 1;
    }> | null;
    originPost: Post | null;
    originPostId: string | null;
    replyCount: number;
    translatedContent: string | null;
    type: number;
    /** url of origin x post */
    url: string;
    userId: string;
    viewCount: number;
}

export type PostListResponse = Response<Post[]>;

export enum PostOrderType {
    ASC = 1,
    DESC = 2,
}

export interface TokenMentionUser {
    avatar: string;
    fanCount: number;
    /** `x_${twitterId}`*/
    id: string;
    /** patched at runtime, remove `x_` from id */
    twitterId: string;
    name: string;
    post: null;
    /** the post user mentioined at */
    postUrl: null;
    /** Twitter handle */
    screenName: string;
    verifyType: number;
}

interface Token {
    address: string;
    avatar: string;
    /** path of avatar url */
    avatarOss: string;
    decimals: number;
    holderCount: number;
    liquidMarketValue: null;
    marketValue: number;
    mentionUserCount: number;
    mentionUsers: TokenMentionUser[];
    name: string;
    narrate: string;
    network: number;
    networkName: string;
    origin: number;
    pass: string;
    passSec: null;
    priceUsd: number;
    program: string;
    symbol: string;
    telegram: string;
    totalSupply: number;
    transVolume24h: number;
    twitter: string;
    website: string;
    discord: string;
}

export type TokenResult = Response<Token>;

export type MentionUsersResponse = Response<{
    caUrl: string;
    mentionUserCount: number;
    mentionUsers: TokenMentionUser[];
    narrate: string;
    narrateEn: string;
}>;
