/* cspell:disable */
interface Message {
    for_user_id: string;
}

interface User {
    id: string;
    id_str: string;
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

interface FavoriteEvent {
    id: string;
    created_at: string;
    timestamp_ms: number;
    favorited_status: {
        created_at: string;
        id: string;
        id_str: string;
        text: string;
        display_text_range: [number, number];
        source: string;
        truncated: boolean;
        in_reply_to_status_id: string | null;
        in_reply_to_status_id_str: string | null;
        in_reply_to_user_id: string | null;
        in_reply_to_user_id_str: string | null;
        in_reply_to_screen_name: string | null;
        conversation_id: number;
        conversation_id_str: string;
        user: User;
        geo: null;
    };
}

interface FollowEvent extends Message {
    type: 'follow' | 'unfollow';
    created_timestamp: string;
    target: User;
    source: User;
}

interface TweetCreateEvent extends Message {
    created_at: string;
    id_str: string;
    text: string;
    source: string;
    user: User;
}

export interface MessagesResponse extends Message {
    user_id: string;
    size: number;
    cursor: number;
    count: number;
    messages: Array<FavoriteEvent | FollowEvent | TweetCreateEvent>;
}
