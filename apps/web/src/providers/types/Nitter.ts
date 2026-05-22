const enum ResponseCode {
    Success = 0,
    Error = -1,
}

export interface Response<T> {
    code: ResponseCode;
    data?: T;
    error?: string;
    error_type?: string;
}

export type GetTweetStatusResponse = Response<{
    tweet: Tweet;
    before: {
        tweets: Tweet[];
    };
    after: {
        tweets: Tweet[];
        hasMore: boolean;
        cursor: string;
    };
    replies: Pagination & {
        tweets: Tweet[];
    };
}>;

export type GetProfileResponse = Response<{
    user: User;
    photoRail: PhotoRail[];
    pinned: Tweet;
}>;

export type GetUserTimelineResponse = Response<{
    pagination: Pagination;
    timeline: Tweet[];
}>;

export type SearchResponse = Response<{
    pagination: Pagination;
    users: User[];
    timeline: Tweet[];
}>;

export const enum UserTimelineTab {
    WithReplies = 'with_replies',
    Media = 'media',
    Search = 'search',
}

export interface Pagination {
    beginning: boolean;
    top: string;
    bottom: string;
}

export const enum UserVerifiedType {
    None = 'None',
    Blue = 'Blue',
    Business = 'Business',
    Government = 'Government',
}

export interface User {
    id: string;
    username: string;
    fullname: string;
    location: string;
    website: string;
    bio: string;
    userPic: string;
    banner: string;
    pinnedTweet: number;
    following: number;
    followers: number;
    tweets: number;
    likes: number;
    media: number;
    verifiedType: UserVerifiedType;
    protected: boolean;
    suspended: boolean;
    joinDate: number;
}

interface PhotoRail {
    url: string;
    tweetId: string;
    color: string;
}

interface Stats {
    replies: number;
    retweets: number;
    likes: number;
    quotes: number;
    views: number;
}

interface TweetVideoVariant {
    contentType: string;
    url: string;
    bitrate: number;
    resolution: number;
}

interface TweetVideo {
    durationMs: number;
    url: string;
    thumb: string;
    views: string;
    available: boolean;
    reason: string;
    title: string;
    description: string;
    playbackType: string;
    variants: TweetVideoVariant[];
}

// https://developer.x.com/en/docs/x-for-websites/cards/overview/abouts-cards
const enum TweetCardKind {
    Player = 'player',
    App = 'app',
    SummaryLargeImage = 'summary_large_image',
    Summary = 'summary',
}

interface TweetCard {
    kind: TweetCardKind;
    url: string;
    title: string;
    dest: string;
    text: string;
    image: string | null;
    video: TweetVideo | null;
}

interface TweetPoll {
    options: string[];
    values: number[];
    votes: number;
    leader: number;
    status: string;
    url: string;
    endTime: string;
    durationMinutes: string;
}

interface TweetMediaPhoto {
    type: 'photo';
    url: string;
    altText: string;
}

interface TweetMediaGif {
    type: 'gif';
    url: string;
    thumb: string;
    altText: string;
}

interface TweetMediaVideo {
    type: 'video';
    durationMs: number;
    url: string;
    thumb: string;
    available: boolean;
    reason: string;
    title: string;
    description: string;
    variants: TweetVideoVariant[];
}

type TweetMedia = TweetMediaPhoto | TweetMediaGif | TweetMediaVideo;

export interface Tweet {
    id: string;
    threadId: string;
    replyId: string;
    user: User;
    text: string;
    time: number;
    reply: string[];
    pinned: boolean;
    hasThread: boolean;
    available: boolean;
    tombstone: string;
    location: string;
    source: string;
    stats: Stats;
    retweet: Tweet | null;
    quote: Tweet | null;
    card: TweetCard | null;
    poll: TweetPoll | null;
    media: TweetMedia[] | null;
    history: number[] | null;
    note: string | null;
    isAd: boolean;
    isAI: boolean;
}
