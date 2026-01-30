/* cspell:disable */
export interface NotificationUser {
    id: string;
    id_str?: string;
    name: string;
    screen_name: string;
    location: string;
    url: string;
    description: string;
    translator_type: string;
    protected: boolean;
    verified: boolean;
    verified_type: string;
    followers_count: number;
    friends_count: number;
    listed_count: number;
    favourites_count: number;
    statuses_count: number;
    created_at: string;
    profile_image_url: string;
    profile_image_url_https: string;
    profile_banner_url: string;
}

export interface NotificationMedia {
    display_url: string;
    expanded_url: string;
    id: number;
    id_str: string;
    indices: [number, number];
    media_url: string;
    media_url_https: string;
    sizes: Record<
        'large' | 'medium' | 'small' | 'thumb',
        {
            w: number;
            h: number;
            resize: 'crop' | 'fit';
        }
    >;
    type: 'photo' | 'video' | 'animated_gif';
    url: string;
    video_info?: {
        aspect_ratio: [number, number];
        variants: Array<{
            bitrate?: number;
            content_type: string;
            url: string;
        }>;
    };
}

export interface NotificationUserMention {
    id: number;
    id_str: string;
    indices: [number, number];
    name: string;
    screen_name: string;
}

interface PostEntities {
    hashtags: unknown[];
    symbols: unknown[];
    urls: unknown[];
    user_mentions: NotificationUserMention[];
    media?: NotificationMedia[];
}

export interface NotificationPost {
    conversation_id: number;
    conversation_id_str: string;
    coordinates: null;
    created_at: string;
    display_text_range?: [number, number];
    entities: PostEntities;
    extended_entities?: {
        media: NotificationMedia[];
    };
    extended_tweet?: {
        display_text_range?: [number, number];
        entities: PostEntities;
        extended_entities?: {
            media: NotificationMedia[];
        };
        full_text: string;
    };
    favorite_count: number;
    favorited: boolean;
    filter_level: string;
    geo: null;
    id: number;
    id_str: string;
    in_reply_to_screen_name: string | null;
    in_reply_to_status_id: number | null;
    in_reply_to_status_id_str: string | null;
    in_reply_to_user_id: number | null;
    in_reply_to_user_id_str: string | null;
    is_quote_status: boolean;
    lang: string;
    place: null;
    possibly_sensitive: boolean;
    quote_count: number;
    reply_count: number;
    retweet_count: number;
    retweeted: boolean;
    source: string;
    text: string;
    truncated: boolean;
    user: NotificationUser;
    retweeted_status?: NotificationPost;
    quoted_status?: NotificationPost;
    quoted_status_id?: number;
    quoted_status_id_str?: string;
}

export interface FavoriteEvent {
    id: string;
    created_at: string;
    timestamp_ms: number;
    user: NotificationUser;
    favorited_status: NotificationPost;
}

export interface FollowEvent {
    type: 'follow' | 'unfollow';
    created_timestamp: string;
    target: NotificationUser;
    source: NotificationUser;
}

export type TweetCreateEvent = NotificationPost;

export interface MessagesResponse {
    user_id: string;
    size: number;
    cursor: number;
    count: number;
    messages: Array<
        | {
              for_user_id: string;
              follow_events: FollowEvent[];
          }
        | {
              for_user_id: string;
              favorite_events: FavoriteEvent[];
          }
        | {
              for_user_id: string;
              tweet_create_events: TweetCreateEvent[];
          }
    >;
}
