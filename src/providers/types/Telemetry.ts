// cspell:disable

import type { ClickOrigin, ProfilePageSource } from '@/constants/enum.js';

export enum VersionFilter {
    // the current working version
    Latest = 'latest',
    // the next version (disabled for the current version)
    Next = 'next',
}

export enum ProviderFilter {
    All = 'all',
    GA = 'google_analytics',
}

enum EventType {
    Debug = 'debug',
    Access = 'access',
    Exit = 'exit',
    Interact = 'interact',
}

enum ExceptionType {
    Error = 'Error',
}

export enum EventId {
    DEBUG = 'debug',

    // account
    ACCOUNT_CREATE_SUCCESS = 'account_create_success',
    ACCOUNT_LOG_OUT_ALL_SUCCESS = 'account_log_out_all_success', // ✅
    ACCOUNT_CONFLICT = 'account_conflict', // ✅
    ACCOUNT_DELETE_SUCCESS = 'account_delete_success', // ✅

    // passcode(sync token)
    PASSCODE_SET_SUCCESS = 'account_multi_device_on',
    PASSCODE_REMOVE_SUCCESS = 'account_multi_device_off',
    PASSCODE_CHANGE_SUCCESS = 'account_sync_password_change_success',
    PASSCODE_RESET_SUCCESS = 'account_sync_password_reset_success',

    // sync token
    TOKEN_SYNC_USE_YES = 'token_sync_use_yes',
    TOKEN_SYNC_USE_NO = 'token_sync_use_no',
    ACCOUNT_CONFLICT_USE_YES = 'account_conflict_use_yes',
    ACCOUNT_CONFLICT_USE_NO = 'account_conflict_use_no',
    MOBILE_QR_LOGIN_CLICK = 'mobile_qr_login_click',
    MULTI_DEVICE_LOGIN_CLICK = 'multi_device_login_click',

    // compose dialog
    COMPOSE_CROSS_POST_SEND_SUCCESS = 'cross_post_send_success', // ✅
    COMPOSE_SCHEDULED_POST_CREATE_SUCCESS = 'scheduled_post_create_success', // ✅
    COMPOSE_SCHEDULED_POST_UPDATE_SUCCESS = 'scheduled_post_update_success', // ✅
    COMPOSE_SCHEDULED_POST_DELETE_SUCCESS = 'scheduled_post_delete_success', // ✅
    COMPOSE_DRAFT_CREATE_SUCCESS = 'draft_create_success', // ✅
    COMPOSE_DRAFT_BUTTON_CLICK = 'drafts_post_history_click', // ✅
    COMPOSE_CROSS_AT_EDIT_SUCCESS = 'cross_at_edit_success', // ✅
    COMPOSE_SCHEDULE_POST_CLICK = 'compose_schedule_click', // ✅
    COMPOSE_RED_PACKET_CLICK = 'compose_red_packet_click', // ✅
    COMPOSE_THREAD_CLICK = 'compose_thread_click', // ✅
    COMPOSE_GIF_CLICK = 'compose_gif_click', // ✅
    COMPOSE_EMOJI_CLICK = 'compose_emoji_click', // ✅
    COMPOSE_IMAGE_ADD_CLICK = 'compose_image_add_click', // ✅
    COMPOSE_VIDEO_ADD_CLICK = 'compose_video_add_click', // ✅
    COMPOSE_SHARE_TO_CHANGE_SUCCESS = 'compose_share_to_change_success', // ✅
    COMPOSE_REPLY_RESTRICTION_CHANGE_SUCCESS = 'compose_reply_restriction_change_success', // ✅
    COMPOSE_FARCASTER_CHANNEL_CHANGE_SUCCESS = 'compose_farcaster_channel_change_success', // ✅
    COMPOSE_LENS_CLUB_CHANGE_SUCCESS = 'compose_lens_club_change_success',
    COMPOSE_SCHEDULE_TAB_CLICK = 'drafts_scheduled_tab_click',
    COMPOSE_DRAFT_DELETE_SUCCESS = 'drafts_post_delete_success',

    // mute
    MUTE_ALL_SUCCESS = 'mute_all_success', // ✅
    MUTE_SUCCESS = 'mute_success', // ✅
    UNMUTE_SUCCESS = 'unmute_success', // ✅

    // tips
    TIPS_SEND_SUBMIT = 'tips_send_submit', // ✅
    TIPS_SEND_SUCCESS = 'tips_send_success', // ✅
    TIPS_SWITCH_RECIPIENT = 'tips_change_wallet_click', // ✅
    TIPS_SHARE_POST_SUCCESS = 'tips_share_success', // ✅

    // poll
    CREATE_ORB_POLL_SUCCESS = 'orb_poll_create_success',
    CREATE_X_POLL_SUCCESS = 'x_poll_create_success',
    CREATE_FAR_POLL_SUCCESS = 'far_poll_create_success',

    // lucky drop
    LUCKY_DROP_CREATE_SUBMIT = 'lucky_drop_create_submit', // ✅
    LUCKY_DROP_CREATE_SUCCESS = 'lucky_drop_create_success', // ✅
    LUCKY_DROP_REFUND_SUBMIT = 'lucky_drop_refund_submit', // ✅
    LUCKY_DROP_REFUND_SUCCESS = 'lucky_drop_refund_success', // ✅
    LUCKY_DROP_CLAIM_SUBMIT = 'lucky_drop_claim_submit', // ✅
    LUCKY_DROP_CLAIM_SUCCESS = 'lucky_drop_claim_success', // ✅

    // blink
    POST_BLINK_ACTION_SUCCESS = 'post_blink_action_success',
    SIGN_MESSAGE_BLINK_ACTION_SUCCESS = 'sign_message_blink_action_success',
    SHOW_BLINK_ACTION = 'show_blink_action',

    // frame
    POST_FRAME_ACTION_CLICK = 'post_mini_app_click', // ✅
    POST_FRAME_ACTION_SUBMIT = 'post_frame_action_submit', // ✅
    POST_FRAME_ACTION_SUCCESS = 'post_frame_action_success', // ✅

    // miniapps
    MINI_APP_FIREFLY_SIGN_IN_SUCCESS = 'mini_app_ff_sign_in_success',
    MINI_APP_FIREFLY_WALLET_SIGN_IN_SUCCESS = 'mini_app_ffwallet_sign_in_success',
    MINI_APP_FARCASTER_SIGN_IN_SUCCESS = 'mini_app_far_sign_in_success',
    MINI_APP_AUTH_WALLET_SIGN_IN_SUCCESS = 'mini_app_auth_wallet_sign_in_success',

    // article
    ARTICLE_COLLECT_SUBMIT = 'article_collect_submit', // ✅
    ARTICLE_COLLECT_SUCCESS = 'article_collect_success', // ✅
    ARTICLE_BOOKMARK_SUCCESS = 'article_bookmark_success', // ✅
    ARTICLE_LIKE_SUCCESS = 'article_like_success', // ✅
    ARTICLE_SHARE_CLICK = 'article_share_click', // ✅
    ARTICLE_VIEW_SOURCE_CLICK = 'article_view_source_click', // ✅
    MIRROR_ARTICLE_CLICK = 'mirror_article_click', // ✅
    PARAGRAPH_ARTICLE_CLICK = 'paragraph_article_click', // ✅
    MATTERS_ARTICLE_CLICK = 'matters_article_click', // ✅

    // snapshot
    SNAPSHOT_VOTE_SUBMIT = 'snapshot_vote_submit', // ✅
    SNAPSHOT_VOTE_SUCCESS = 'snapshot_vote_success', // ✅

    // mint
    MINT_NFT_SUBMIT = 'nft_mint_submit', // ✅
    MINT_NFT_SUCCESS = 'nft_mint_success', // ✅
    NFT_MINT_CLICK = 'nft_mint_click',
    NFT_VIEW_WEBSITE_CLICK = 'nft_view_website_click',

    // profile
    PROFILE_EDIT_CLICK = 'account_edit_profile_click', // ✅
    PROFILE_EDIT_SUCCESS = 'account_edit_profile_success', // ✅
    PROFILE_CHANGE_ACCOUNT_CLICK = 'profile_change_account_click',

    // connect wallet
    CONNECT_WALLET_SUBMIT = 'connect_wallet_submit', // ✅
    CONNECT_WALLET_SUCCESS = 'connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_METAMASK = 'metamask_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_RABBY = 'rabby_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_WALLET_CONNECT = 'walletconnect_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_COINBASE = 'coinbase_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_BINANCE = 'binancewallet_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_OKX = 'okxwallet_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_ZERION = 'zerion_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_RAINBOW = 'rainbow_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_PHANTOM = 'phantom_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_SOLFLARE = 'solflare_connect_wallet_success', // ✅

    // farcaster
    FARCASTER_LOG_IN_SUCCESS = 'farcaster_log_in_success', // ✅
    FARCASTER_LOG_OUT_SUCCESS = 'farcaster_log_out_success', // ✅
    FARCASTER_ACCOUNT_DISCONNECT_SUCCESS = 'account_farcaster_disconnect_success',
    FARCASTER_POST_SEND_SUCCESS = 'farcaster_cast_send_success', // ✅
    FARCASTER_POST_LIKE_SUCCESS = 'farcaster_cast_like_success', // ✅
    FARCASTER_POST_UNLIKE_SUCCESS = 'farcaster_cast_unlike_success', // ✅
    FARCASTER_POST_REPLY_SUCCESS = 'farcaster_cast_reply_success', // ✅
    FARCASTER_POST_REPOST_SUCCESS = 'farcaster_cast_recast_success', // ✅
    FARCASTER_POST_UNDO_REPOST_SUCCESS = 'farcaster_cast_undo_recast_success', // ✅
    FARCASTER_POST_DELETE_SUCCESS = 'farcaster_cast_delete_success', // ✅
    FARCASTER_POST_QUOTE_SUCCESS = 'farcaster_cast_quote_success', // ✅
    FARCASTER_POST_SHARE_SUCCESS = 'farcaster_cast_share_success', // ✅
    FARCASTER_POST_BOOKMARK_SUCCESS = 'farcaster_cast_bookmark_success', // ✅
    FARCASTER_POST_UNBOOKMARK_SUCCESS = 'farcaster_cast_unbookmark_success', // ✅
    FARCASTER_POST_COLLECT_SUCCESS = 'farcaster_cast_collect_success', // ✅
    FARCASTER_PROFILE_FOLLOW_SUCCESS = 'farcaster_follow_success', // ✅
    FARCASTER_PROFILE_UNFOLLOW_SUCCESS = 'farcaster_unfollow_success', // ✅
    FARCASTER_PROFILE_SUPER_FOLLOW_SUBMIT = 'farcaster_superfollow_submit', // ✅
    FARCASTER_PROFILE_SUPER_FOLLOW_SUCCESS = 'farcaster_superfollow_success', // ✅
    FARCASTER_SIGNUP_ENTRY_CLICK = 'farcaster_sign_up_click',
    FARCASTER_ACCOUNT_CREATE_SUCCESS = 'farcaster_sign_up_success',
    FARCASTER_LOGIN_FIRST_TIME = 'farcaster_first_time_click',
    FARCASTER_LOGIN_RECONNECT = 'farcaster_signed_in_before_click',

    // lens
    LENS_ACCOUNT_LOG_IN_SUCCESS = 'lens_log_in_success', // ✅
    LENS_ACCOUNT_LOG_OUT_SUCCESS = 'lens_log_out_success', // ✅
    LENS_ACCOUNT_DISCONNECT_SUCCESS = 'account_lens_disconnect_success',
    LENS_POST_SEND_SUCCESS = 'lens_post_send_success', // ✅
    LENS_POST_LIKE_SUCCESS = 'lens_post_like_success', // ✅
    LENS_POST_UNLIKE_SUCCESS = 'lens_post_unlike_success', // ✅
    LENS_POST_REPLY_SUCCESS = 'lens_post_reply_success', // ✅
    LENS_POST_REPOST_SUCCESS = 'lens_post_repost_success', // ✅
    LENS_POST_UNDO_REPOST_SUCCESS = 'lens_post_unmirror_success', // ✅
    LENS_POST_DELETE_SUCCESS = 'lens_post_delete_success', // ✅
    LENS_POST_QUOTE_SUCCESS = 'lens_post_quote_success', // ✅
    LENS_POST_SHARE_SUCCESS = 'lens_post_share_success', // ✅
    LENS_POST_BOOKMARK_SUCCESS = 'lens_post_bookmark_success', // ✅
    LENS_POST_UNBOOKMARK_SUCCESS = 'lens_post_unbookmark_success', // ✅
    LENS_POST_COLLECT_SUBMIT = 'lens_post_collect_submit', // ✅
    LENS_POST_COLLECT_SUCCESS = 'lens_post_collect_success', // ✅
    LENS_PROFILE_FOLLOW_SUCCESS = 'lens_follow_success', // ✅
    LENS_PROFILE_UNFOLLOW_SUCCESS = 'lens_unfollow_success', // ✅
    LENS_PROFILE_SUPER_FOLLOW_SUBMIT = 'lens_superfollow_submit', // ✅
    LENS_PROFILE_SUPER_FOLLOW_SUCCESS = 'lens_superfollow_success', // ✅
    LENS_SIGNUP_ENTRY_CLICK = 'lens_sign_up_click',
    LENS_ACCOUNT_CREATE_SUCCESS = 'lens_sign_up_success',
    LENS_BIND_MANAGER_SUCCESS = 'lens_auto_login_set_success',

    // x
    X_ACCOUNT_LOG_IN_SUCCESS = 'x_log_in_success', // ✅
    X_ACCOUNT_LOG_OUT_SUCCESS = 'x_log_out_success', // ✅
    X_ACCOUNT_DISCONNECT_SUCCESS = 'account_x_disconnect_success',
    X_POST_SEND_SUCCESS = 'x_post_send_success', // ✅
    X_POST_LIKE_SUCCESS = 'x_post_like_success', // ✅
    X_POST_UNLIKE_SUCCESS = 'x_post_unlike_success', // ✅
    X_POST_REPLY_SUCCESS = 'x_post_reply_success', // ✅
    X_POST_REPOST_SUCCESS = 'x_post_repost_success', // ✅
    X_POST_UNDO_REPOST_SUCCESS = 'x_post_undo_repost_success', // ✅
    X_POST_DELETE_SUCCESS = 'x_post_delete_success', // ✅
    X_POST_QUOTE_SUCCESS = 'x_post_quote_success', // ✅
    X_POST_SHARE_SUCCESS = 'x_post_share_success', // ✅
    X_POST_BOOKMARK_SUCCESS = 'x_post_bookmark_success', // ✅
    X_POST_UNBOOKMARK_SUCCESS = 'x_post_unbookmark_success', // ✅
    X_POST_COLLECT_SUCCESS = 'x_post_collect_success', // ✅
    X_PROFILE_FOLLOW_SUCCESS = 'x_follow_success', // ✅
    X_PROFILE_UNFOLLOW_SUCCESS = 'x_unfollow_success', // ✅
    X_PROFILE_SUPER_FOLLOW_SUCCESS = 'x_superfollow_success', // ✅

    // bsky
    BSKY_ACCOUNT_LOG_IN_SUCCESS = 'bsky_log_in_success', // ✅
    BSKY_ACCOUNT_LOG_OUT_SUCCESS = 'bsky_log_out_success', // ✅
    BSKY_ACCOUNT_DISCONNECT_SUCCESS = 'account_bsky_disconnect_success',
    BSKY_POST_SEND_SUCCESS = 'bsky_post_send_success', // ✅
    BSKY_POST_LIKE_SUCCESS = 'bsky_post_like_success', // ✅
    BSKY_POST_UNLIKE_SUCCESS = 'bsky_post_unlike_success', // ✅
    BSKY_POST_REPLY_SUCCESS = 'bsky_post_reply_success', // ✅
    BSKY_POST_REPOST_SUCCESS = 'bsky_post_repost_success', // ✅
    BSKY_POST_UNDO_REPOST_SUCCESS = 'bsky_post_undo_repost_success', // ✅
    BSKY_POST_DELETE_SUCCESS = 'bsky_post_delete_success', // ✅
    BSKY_POST_QUOTE_SUCCESS = 'bsky_post_quote_success', // ✅
    BSKY_POST_SHARE_SUCCESS = 'bsky_post_share_success', // ✅
    BSKY_POST_BOOKMARK_SUCCESS = 'bsky_post_bookmark_success', // ✅
    BSKY_POST_UNBOOKMARK_SUCCESS = 'bsky_post_unbookmark_success', // ✅
    BSKY_POST_COLLECT_SUCCESS = 'bsky_post_collect_success', // ✅
    BSKY_PROFILE_FOLLOW_SUCCESS = 'bsky_follow_success', // ✅
    BSKY_PROFILE_UNFOLLOW_SUCCESS = 'bsky_unfollow_success', // ✅
    BSKY_PROFILE_SUPER_FOLLOW_SUCCESS = 'bsky_superfollow_success', // ✅

    // orb
    ORB_LOGIN_IN_CLICK = 'orb_log_in_click',
    ORB_LOGIN_IN_SUCCESS = 'orb_log_in_success',

    // wallet
    WALLET_FOLLOW_SUCCESS = 'wallet_follow_success',
    WALLET_UNFOLLOW_SUCCESS = 'wallet_unfollow_success',

    // apple
    APPLE_ACCOUNT_LOG_IN_SUCCESS = 'apple_log_in_success',
    APPLE_ACCOUNT_LOG_OUT_SUCCESS = 'apple_log_out_success',
    APPLE_ACCOUNT_DISCONNECT_SUCCESS = 'apple_disconnect_success',

    // google
    GOOGLE_ACCOUNT_LOG_IN_SUCCESS = 'google_log_in_success',
    GOOGLE_ACCOUNT_LOG_OUT_SUCCESS = 'google_log_out_success',
    GOOGLE_ACCOUNT_DISCONNECT_SUCCESS = 'google_disconnect_success',

    // telegram
    TELEGRAM_ACCOUNT_LOG_IN_SUCCESS = 'telegram_log_in_success',
    TELEGRAM_ACCOUNT_LOG_OUT_SUCCESS = 'telegram_log_out_success',
    TELEGRAM_ACCOUNT_DISCONNECT_SUCCESS = 'telegram_disconnect_success',

    EMAIL_ACCOUNT_LOG_IN_SUCCESS = 'email_log_in_success',
    EMAIL_ACCOUNT_LOG_OUT_SUCCESS = 'email_log_out_success',
    EMAIL_ACCOUNT_DISCONNECT_SUCCESS = 'email_disconnect_success',

    // activity
    EVENT_SHARE_CLICK = 'event_share_click',
    EVENT_FARCASTER_LOG_IN_SUCCESS = 'event_far_log_in_success',
    EVENT_LENS_LOG_IN_SUCCESS = 'event_lens_log_in_success',
    EVENT_X_LOG_IN_SUCCESS = 'event_x_log_in_success',
    EVENT_BSKY_LOG_IN_SUCCESS = 'event_bsky_log_in_success',
    EVENT_CONNECT_WALLET_SUCCESS = 'event_connect_wallet_success',
    EVENT_CHANGE_WALLET_SUCCESS = 'event_change_wallet_success',
    EVENT_CLAIM_BASIC_SUCCESS = 'event_claim_basic_success',
    EVENT_CLAIM_PREMIUM_SUCCESS = 'event_claim_premium_success',

    // swap
    EVENT_FOLLOWING_SWAP_CLICK = 'following_swap_click',
    EVENT_LIKE_SWAP_CLICK = 'swap_like_success',
    EVENT_SWAP_DETAIL_CLICK = 'swap_detail_click',
    EVENT_SWAP_COPY_TRADE_CLICK = 'swap_copy_trade_click',
    EVENT_SWAP_SUBMIT = 'swap_submit',
    EVENT_SWAP_SUCCESS = 'swap_success',

    // token
    TOKEN_BOOKMARK_CLICK = 'token_bookmark_click',
    BOOKMARK_TOKEN_VIEW = 'token_bookmark_view',

    // channel
    FARCASTER_CHANNEL_JOIN_SUCCESS = 'farcaster_channel_join_success',
    FARCASTER_CHANNEL_LEAVE_SUCCESS = 'farcaster_channel_leave_success',
    CHANNEL_JOIN_ON_LENS_SUCCESS = 'lens_group_join_success',
    CHANNEL_LEAVE_ON_LENS_SUCCESS = 'lens_group_leave_success',
    CHANNEL_ADD_ON_BSKY_SUCCESS = 'bsky_feed_add_success',
    CHANNEL_REMOVE_ON_BSKY_SUCCESS = 'bsky_feed_remove_success',

    // filter tab
    POSTS_FILTER_CHANGE = 'tab_social_filter_click',
    CHAIN_FILTER_CHANGE = 'tab_chain_filter_click',
    TYPE_FILTER_CHANGE = 'tab_type_filter_click',
    QUALITY_FILTER_OFF = 'tab_quality_filter_off_click',
    ACTIVITIES_FILTER_CHANGE = 'tab_platform_filter_click',

    // firefly wallet
    FIREFLY_WALLET_OPEN_SUCCESS = 'Firefly_wallet_open_success',
    FIREFLY_WALLET_RECEIVE_CLICK = 'Firefly_wallet_receive_click',
    FIREFLY_WALLET_SEND_CLICK = 'Firefly_wallet_send_click',
    FIREFLY_WALLET_SWAP_CLICK = 'Firefly_wallet_swap_click',
    FIREFLY_WALLET_CHAIN_FILTER_CLICK = 'Firefly_wallet_chain_filter_click',
    FIREFLY_WALLET_TOKENS_TAB_CLICK = 'Firefly_wallet_tokens_tab_click',
    FIREFLY_WALLET_NFTS_TAB_CLICK = 'Firefly_wallet_NFTs_tab_click',
    FIREFLY_WALLET_TRANSACTIONS_TAB_CLICK = 'Firefly_wallet_transactions_tab_click',
    FIREFLY_WALLET_SEND_SUCCESS = 'Firefly_wallet_send_success',
    FIREFLY_WALLET_TXN_CALL = 'Firefly_wallet_txn_call',
    FIREFLY_WALLET_GENERAL_TRANSACTION_SUBMIT = 'Firefly_wallet_general_transaction_submit',
    FIREFLY_WALLET_SEND_RECIPIENT_SELECT = 'Firefly_wallet_send_recipient_select',
    FIREFLY_WALLET_SEND_RECIPIENT_CHANGE_WALLET_CLICK = 'Firefly_wallet_send_recipient_change_wallet_click',
    FIREFLY_WALLET_SEND_RECIPIENT_WALLET_CHANGE = 'Firefly_wallet_send_recipient_wallet_change',

    NEW_NOTIFICATION_CLICK = 'notification_update_click',

    // polymarket
    POLYMARKET_PROFILE_DETAIL_LINK_CLICK = 'profile_wallet_bets_detail_click',
    PROFILE_POLYMARKET_LINK_CLICK = 'profile_wallet_bets_click',
    FOLLOWING_POLYMARKET_LINK_CLICK = 'following_bets_click',
}

export enum ExceptionId {
    BIND_OR_RESTORE_FIREFLY_SESSION = 'bind_or_restore_firefly_session',
    RESUME_LENS_SESSION = 'resume_lens_session',
    RESUME_BSKY_SESSION = 'resume_bsky_session',
    RESUME_TWITTER_SESSION = 'resume_twitter_session',
    CREATE_PRIVY_WALLET = 'create_privy_wallet',
    UI_CRASH = 'ui_crash',
    USER_REPORT = 'user_report',
}

interface Event {
    type: EventType;
    // bypassing the type check
    parameters: {};
}

interface Exception {
    type: ExceptionType;
    error: Error;
}

export type AccountPairs = Array<[string, string]>; // [id, handle]

export const enum FarcasterLoginType {
    Reconnect = 'Reconnect',
    NewConnect = 'NewConnect',
    Wallet = 'Wallet',
}

export type FrameActionType = 'click' | 'buy' | 'mint' | 'others';

export interface FarcasterEventParameters {
    firefly_account_id: string;
    farcaster_handle: string;
    farcaster_id: string;
    target_farcaster_id?: string;
    target_farcaster_handle?: string;
}

export interface FarcasterPostEventParameters extends FarcasterEventParameters {
    target_farcaster_cast_id: string;
}

export interface LensEventParameters {
    firefly_account_id: string;
    lens_id: string;
    lens_handle: string;
    target_lens_id: string;
    target_lens_handle: string;
}

export interface LensPostEventParameters extends LensEventParameters {
    target_lens_post_id: string;
}

export interface TwitterEventParameters {
    firefly_account_id: string;
    x_id: string;
    x_handle: string;
    target_x_id: string;
    target_x_handle: string;
}

export interface TwitterPostEventParameters extends TwitterEventParameters {
    target_x_post_id: string;
}

export interface BskyEventParameters {
    firefly_account_id: string;
    bsky_id: string;
    bsky_handle: string;
    target_bsky_id: string;
    target_bsky_handle: string;
}

interface BskyPostEventParameters extends BskyEventParameters {
    target_bsky_post_id: string;
}

interface WalletEventBaseParameters {
    firefly_account_id: string;
    wallet_type?: 'evm' | 'solana' | 'unknown';
    wallet_address?: string;
    wallet_app_name?: string;
}
export interface WalletEventParameters extends Exclude<WalletEventBaseParameters, 'wallet_type'> {
    wallet_type: 'evm' | 'solana' | 'unknown';
    wallet_address: string;
    wallet_name: string;
}

interface ActivityWalletEventParameters extends WalletEventParameters {
    activity: string;
}

interface LuckyDropEventParameters extends WalletEventParameters {
    lucky_drop_id: string;
    amount: string;
    currency: string;
    amount_usd?: number;
    winners: number;
    distribution_rule: 'random' | 'equal';
    chain_id: string;
    chain_name: string;
    free_gas: boolean;
}

interface ConnectWalletEventParameters extends WalletEventParameters {
    click_location: ClickOrigin;
    click_time: number;
    connect_success_time: number;
    connect_duration: number;
}

export interface ComposeEventParameters {
    firefly_account_id: string;

    // lens
    include_lens_post: boolean;
    lens_id?: string;
    lens_handle?: string;
    lens_post_ids?: string[];

    // farcaster
    include_farcaster_cast: boolean;
    farcaster_id?: string;
    farcaster_handle?: string;
    farcaster_cast_ids?: string[];

    // twitter
    include_x_post: boolean;
    x_id?: string;
    x_handle?: string;
    x_post_ids?: string[];

    include_bsky_post: boolean;
    bsky_id?: string;
    bsky_handle?: string;
    bsky_post_ids?: string[];

    // thread
    is_thread: boolean;

    // cross quote
    is_cross_quote: boolean;

    // draft
    is_draft: boolean;
    draft_id?: string;

    // schedule
    is_scheduled: boolean;
    schedule_id?: string;

    // rp
    include_lucky_drop: boolean;
    lucky_drop_ids?: string[];

    // poll
    include_poll: boolean;
    poll_id?: string;

    include_x_poll: boolean;
    x_poll_id?: string;

    include_lens_poll: boolean;
    lens_poll_id?: string;

    include_farcaster_poll: boolean;
    farcaster_poll_id?: string;

    // flags
    include_image: boolean;
    include_video: boolean;
}

export interface Events extends Record<EventId, Event> {
    [EventId.DEBUG]: {
        type: EventType.Debug;
        parameters: {
            message: string;
        };
    };

    [EventId.ACCOUNT_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;

            // lens
            by_lens: boolean;
            lens_id?: string;
            lens_handle?: string;

            // farcaster
            by_farcaster: boolean;
            farcaster_id?: string;
            farcaster_handle?: string;

            // x
            by_x: boolean;
            x_id?: string;
            x_handle?: string;
        };
    };
    [EventId.ACCOUNT_LOG_OUT_ALL_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.PROFILE_EDIT_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.PROFILE_CHANGE_ACCOUNT_CLICK]: {
        type: EventType.Interact;
        parameters: {
            target_platform: ProfilePageSource;
            target_id: string;
        };
    };
    [EventId.PROFILE_EDIT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            change_avatar: boolean;
            change_nickname: boolean;
        };
    };
    [EventId.ACCOUNT_CONFLICT]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            conflict_firefly_account_id: string;
            continue_login: boolean;
        };
    };
    [EventId.ACCOUNT_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            farcaster_accounts: AccountPairs;
            lens_accounts: AccountPairs;
            x_accounts: AccountPairs;
            bsky_accounts: AccountPairs;
        };
    };

    [EventId.ACCOUNT_CONFLICT_USE_YES]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            conflict_firefly_account_id: string;
        };
    };
    [EventId.ACCOUNT_CONFLICT_USE_NO]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            conflict_firefly_account_id: string;
        };
    };

    [EventId.CONNECT_WALLET_SUBMIT]: {
        type: EventType.Interact;
        parameters: Omit<ConnectWalletEventParameters, 'wallet_address' | 'connect_success_time' | 'connect_duration'>;
    };
    [EventId.CONNECT_WALLET_SUCCESS]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_METAMASK]: {
        type: EventType.Interact;
        parameters: WalletEventBaseParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_RABBY]: {
        type: EventType.Interact;
        parameters: WalletEventBaseParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_WALLET_CONNECT]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_COINBASE]: {
        type: EventType.Interact;
        parameters: WalletEventBaseParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_BINANCE]: {
        type: EventType.Interact;
        parameters: WalletEventBaseParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_OKX]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_ZERION]: {
        type: EventType.Interact;
        parameters: WalletEventBaseParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_RAINBOW]: {
        type: EventType.Interact;
        parameters: WalletEventBaseParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_PHANTOM]: {
        type: EventType.Interact;
        parameters: WalletEventBaseParameters;
    };

    [EventId.COMPOSE_CROSS_POST_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: ComposeEventParameters;
    };
    [EventId.COMPOSE_SCHEDULED_POST_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            schedule_id: string;
            schedule_time: number;
            scheduled_time_utc: string; // mm-dd-yyyy hh:mm:ss(GMT+0)
        } & ComposeEventParameters;
    };
    [EventId.COMPOSE_SCHEDULED_POST_UPDATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            schedule_id: string;
            new_schedule_time: number;
            new_scheduled_time_utc: string; // mm-dd-yyyy hh:mm:ss(GMT+0)
        };
    };
    [EventId.COMPOSE_SCHEDULED_POST_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            schedule_id: string;
            schedule_time: number;
            scheduled_time_utc: string; // mm-dd-yyyy hh:mm:ss(GMT+0)
        };
    };
    [EventId.COMPOSE_DRAFT_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            draft_id: string;
            draft_time: number;
            draft_time_utc: string; // mm-dd-yyyy hh:mm:ss(GMT+0)
        } & ComposeEventParameters;
    };
    [EventId.COMPOSE_DRAFT_BUTTON_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.MUTE_ALL_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.MUTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.UNMUTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.TIPS_SEND_SUBMIT]: {
        type: EventType.Interact;
        parameters: {
            target_wallet_address: string; // address all lowercased
            target_firefly_account_id?: string;
            amount: string;
            currency: string;
            amount_usd?: number;
            chain_id: number;
            chain_name: string;
            is_custom_amount: boolean;
        } & WalletEventParameters;
    };
    [EventId.TIPS_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            target_wallet_address: string; // address all lowercased
            target_firefly_account_id?: string;
            amount: string;
            currency: string;
            amount_usd?: number;
            chain_id: number;
            chain_name: string;
            is_custom_amount: boolean;
        } & WalletEventParameters;
    };
    [EventId.TIPS_SWITCH_RECIPIENT]: {
        type: EventType.Interact;
        parameters: {
            target_firefly_account_id: string;
            target_wallet_address: string;
        };
    };
    [EventId.TIPS_SHARE_POST_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            target_firefly_account_id: string;
            transaction_id: string;
        };
    };
    [EventId.LUCKY_DROP_CREATE_SUBMIT]: {
        type: EventType.Interact;
        parameters: LuckyDropEventParameters;
    };
    [EventId.LUCKY_DROP_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: LuckyDropEventParameters;
    };
    [EventId.LUCKY_DROP_CLAIM_SUBMIT]: {
        type: EventType.Interact;
        parameters: LuckyDropEventParameters;
    };
    [EventId.LUCKY_DROP_CLAIM_SUCCESS]: {
        type: EventType.Interact;
        parameters: LuckyDropEventParameters;
    };
    [EventId.LUCKY_DROP_REFUND_SUBMIT]: {
        type: EventType.Interact;
        parameters: WalletEventParameters;
    };
    [EventId.LUCKY_DROP_REFUND_SUCCESS]: {
        type: EventType.Interact;
        parameters: WalletEventParameters;
    };
    [EventId.CREATE_ORB_POLL_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            post_id: string;
        };
    };
    [EventId.CREATE_X_POLL_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            poll_id: string;
        };
    };
    [EventId.CREATE_FAR_POLL_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            poll_id: string;
        };
    };
    [EventId.SNAPSHOT_VOTE_SUBMIT]: {
        type: EventType.Interact;
        parameters: WalletEventParameters;
    };
    [EventId.SNAPSHOT_VOTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: WalletEventParameters;
    };
    [EventId.MINT_NFT_SUBMIT]: {
        type: EventType.Interact;
        parameters: {
            chain_id: string;
            free_mint: boolean;
            nft_ca: string;
        } & WalletEventParameters;
    };
    [EventId.MINT_NFT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            chain_id: string;
            free_mint: boolean;
            nft_ca: string;
        } & WalletEventParameters;
    };
    [EventId.NFT_MINT_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            chain_id: number;
            nft_ca: string;
        };
    };
    [EventId.NFT_VIEW_WEBSITE_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            chain_id: number;
            nft_ca: string;
        };
    };
    [EventId.ARTICLE_COLLECT_SUBMIT]: {
        type: EventType.Interact;
        parameters: {
            article_id: string;
            free_mint: boolean;
        } & WalletEventParameters;
    };
    [EventId.ARTICLE_COLLECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            article_id: string;
            free_mint: boolean;
        } & WalletEventParameters;
    };
    [EventId.ARTICLE_BOOKMARK_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            article_id: string;
        };
    };
    [EventId.ARTICLE_LIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            article_id: string;
        };
    };
    [EventId.ARTICLE_SHARE_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            article_id: string;
        };
    };
    [EventId.ARTICLE_VIEW_SOURCE_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            article_id: string;
        };
    };
    [EventId.MIRROR_ARTICLE_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.PARAGRAPH_ARTICLE_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.MATTERS_ARTICLE_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.POST_FRAME_ACTION_CLICK]: {
        type: EventType.Interact;
        parameters: {
            frame_action: FrameActionType;
            frame_version: string;
            frame_url: string;
        } & WalletEventParameters;
    };
    [EventId.POST_FRAME_ACTION_SUBMIT]: {
        type: EventType.Interact;
        parameters: {
            frame_action: FrameActionType;
            frame_version: string;
            frame_url: string;
        } & WalletEventParameters;
    };
    [EventId.POST_FRAME_ACTION_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            frame_action: FrameActionType;
            frame_version: string;
            frame_url: string;
        } & WalletEventParameters;
    };
    [EventId.MINI_APP_FIREFLY_SIGN_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            frame_version: string;
            frame_url: string;
            mini_app_name: string;
        };
    };
    [EventId.MINI_APP_FIREFLY_WALLET_SIGN_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            frame_version: string;
            frame_url: string;
            mini_app_name: string;
        };
    };
    [EventId.MINI_APP_FARCASTER_SIGN_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            frame_version: string;
            frame_url: string;
            mini_app_name: string;
        };
    };
    [EventId.MINI_APP_AUTH_WALLET_SIGN_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            frame_version: string;
            frame_url: string;
            mini_app_name: string;
        };
    };
    [EventId.POST_BLINK_ACTION_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            blink_action: 'buy' | 'mint' | 'others';
        } & WalletEventParameters;
    };
    [EventId.SIGN_MESSAGE_BLINK_ACTION_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            blink_action: 'buy' | 'mint' | 'others';
        } & WalletEventParameters;
    };
    [EventId.SHOW_BLINK_ACTION]: {
        type: EventType.Interact;
        parameters: {
            blink_url: string;
        };
    };

    // ----------------
    // farcaster
    // ----------------

    [EventId.FARCASTER_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            farcaster_accounts: AccountPairs;
            login_type: FarcasterLoginType;
        };
    };
    [EventId.FARCASTER_LOG_OUT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            farcaster_id: string;
            farcaster_handle: string;
        };
    };
    [EventId.FARCASTER_ACCOUNT_DISCONNECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            farcaster_id: string;
            farcaster_handle: string;
        };
    };
    [EventId.FARCASTER_POST_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            farcaster_cast_ids?: string[];
        } & ComposeEventParameters;
    };
    [EventId.FARCASTER_POST_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            farcaster_id: string;
            farcaster_handle: string;
            farcaster_cast_id: string;
        };
    };
    [EventId.FARCASTER_POST_LIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_UNLIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_REPLY_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_UNDO_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_QUOTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_SHARE_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_BOOKMARK_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_PROFILE_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterEventParameters;
    };
    [EventId.FARCASTER_PROFILE_UNFOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterEventParameters;
    };
    [EventId.FARCASTER_PROFILE_SUPER_FOLLOW_SUBMIT]: {
        type: EventType.Interact;
        parameters: FarcasterEventParameters & WalletEventParameters;
    };
    [EventId.FARCASTER_PROFILE_SUPER_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterEventParameters & WalletEventParameters;
    };
    [EventId.FARCASTER_ACCOUNT_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            farcaster_handle: string;
            farcaster_id: string;
        };
    };

    // ----------------
    // lens
    // ----------------

    [EventId.LENS_ACCOUNT_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            lens_accounts: AccountPairs;
            is_manager: boolean;
            privy_login_type?: 'refresh_page' | 'intercept_api';
        };
    };
    [EventId.LENS_ACCOUNT_LOG_OUT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            lens_id: string;
            lens_handle: string;
        };
    };
    [EventId.LENS_ACCOUNT_DISCONNECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            lens_id: string;
            lens_handle: string;
        };
    };
    [EventId.LENS_POST_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            lens_post_ids?: string[];
        } & ComposeEventParameters;
    };
    [EventId.LENS_POST_LIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_UNLIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_REPLY_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_UNDO_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            lens_id: string;
            lens_handle: string;
            lens_post_id: string;
        };
    };
    [EventId.LENS_POST_QUOTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_SHARE_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_BOOKMARK_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_COLLECT_SUBMIT]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_COLLECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_PROFILE_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensEventParameters;
    };
    [EventId.LENS_PROFILE_UNFOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensEventParameters;
    };
    [EventId.LENS_PROFILE_SUPER_FOLLOW_SUBMIT]: {
        type: EventType.Interact;
        parameters: LensEventParameters & WalletEventParameters;
    };
    [EventId.LENS_PROFILE_SUPER_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensEventParameters & WalletEventParameters;
    };
    [EventId.LENS_ACCOUNT_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            lens_id: string;
            lens_handle: string;
        };
    };
    [EventId.LENS_BIND_MANAGER_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            lens_id: string;
            lens_handle: string;
        };
    };

    // ----------------
    // x
    // ----------------

    [EventId.X_ACCOUNT_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            x_accounts: AccountPairs;
        };
    };
    [EventId.X_ACCOUNT_LOG_OUT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            x_id: string;
            x_handle: string;
        };
    };
    [EventId.X_ACCOUNT_DISCONNECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            x_id: string;
            x_handle: string;
        };
    };
    [EventId.X_POST_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            x_post_ids?: string[];
        } & ComposeEventParameters;
    };
    [EventId.X_POST_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            x_id: string;
            x_handle: string;
            x_post_id: string;
        };
    };
    [EventId.X_POST_REPLY_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_LIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_UNLIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_QUOTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_UNDO_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_SHARE_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_BOOKMARK_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_PROFILE_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterEventParameters;
    };
    [EventId.X_PROFILE_UNFOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterEventParameters;
    };
    [EventId.X_PROFILE_SUPER_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterEventParameters & WalletEventParameters;
    };

    // ----------------
    // bsky
    // ----------------

    [EventId.BSKY_ACCOUNT_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            bsky_accounts: AccountPairs;
        };
    };
    [EventId.BSKY_ACCOUNT_LOG_OUT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            bsky_id: string;
            bsky_handle: string;
        };
    };
    [EventId.BSKY_ACCOUNT_DISCONNECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            bsky_id: string;
            bsky_handle: string;
        };
    };
    [EventId.BSKY_POST_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            bsky_post_ids?: string[];
        } & ComposeEventParameters;
    };
    [EventId.BSKY_POST_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            bsky_id: string;
            bsky_handle: string;
            bsky_post_id: string;
        };
    };
    [EventId.BSKY_POST_REPLY_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_LIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_UNLIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_QUOTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_UNDO_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_SHARE_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_BOOKMARK_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_PROFILE_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyEventParameters;
    };
    [EventId.BSKY_PROFILE_UNFOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyEventParameters;
    };
    [EventId.BSKY_PROFILE_SUPER_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyEventParameters & WalletEventParameters;
    };

    // ----------------
    // orb
    // ----------------
    [EventId.ORB_LOGIN_IN_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.ORB_LOGIN_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            lens_accounts: AccountPairs;
        };
    };

    // Wallet
    [EventId.WALLET_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.WALLET_UNFOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };

    // Activity
    [EventId.EVENT_X_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            x_accounts: AccountPairs;
        };
    };
    [EventId.EVENT_LENS_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            lens_accounts: AccountPairs;
        };
    };
    [EventId.EVENT_FARCASTER_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            farcaster_accounts: AccountPairs;
        };
    };
    [EventId.EVENT_SHARE_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            activity: string;
        };
    };
    [EventId.EVENT_CONNECT_WALLET_SUCCESS]: {
        type: EventType.Interact;
        parameters: ActivityWalletEventParameters;
    };
    [EventId.EVENT_CHANGE_WALLET_SUCCESS]: {
        type: EventType.Interact;
        parameters: ActivityWalletEventParameters;
    };
    [EventId.EVENT_CLAIM_BASIC_SUCCESS]: {
        type: EventType.Interact;
        parameters: ActivityWalletEventParameters;
    };
    [EventId.EVENT_CLAIM_PREMIUM_SUCCESS]: {
        type: EventType.Interact;
        parameters: ActivityWalletEventParameters;
    };
    [EventId.POSTS_FILTER_CHANGE]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            social_selected: string;
            page_source: string;
        };
    };

    [EventId.CHAIN_FILTER_CHANGE]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            chain_id: string;
            chain_name: string;
            page_source: string;
        };
    };
    [EventId.TYPE_FILTER_CHANGE]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            type_selected: string;
        };
    };
    [EventId.QUALITY_FILTER_OFF]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };

    [EventId.ACTIVITIES_FILTER_CHANGE]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            platform_selected: string[];
            page_source: string;
        };
    };

    // ----------------
    // swap
    // ----------------
    [EventId.EVENT_SWAP_SUBMIT]: {
        type: EventType.Interact;
        parameters: {
            wallet_address: string;
            amount?: string;
            currency?: string;
            amount_usd?: string;
            chain_id?: number;
            chain_name?: string;
            wallet_type: string;
            wallet_name: string;
            time: string;
            tx_hash?: string;
        };
    };
    [EventId.EVENT_SWAP_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            wallet_address: string;
            amount?: string;
            currency?: string;
            amount_usd?: string;
            chain_id?: number;
            chain_name?: string;
            wallet_type: string;
            wallet_name: string;
            time: string;
            tx_hash?: string;
        };
    };

    // token
    [EventId.TOKEN_BOOKMARK_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.BOOKMARK_TOKEN_VIEW]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            source: 'direct' | 'toast_view' | 'sidebar_more';
        };
    };

    // firefly wallet
    [EventId.FIREFLY_WALLET_OPEN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            wallet_address: string;
            MPC_type: 'privy' | 'particle';
        };
    };
    [EventId.FIREFLY_WALLET_RECEIVE_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.FIREFLY_WALLET_SEND_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.FIREFLY_WALLET_SWAP_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.FIREFLY_WALLET_CHAIN_FILTER_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            chain_type: 'EVM' | 'Sol';
        };
    };
    [EventId.FIREFLY_WALLET_TOKENS_TAB_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.FIREFLY_WALLET_NFTS_TAB_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.FIREFLY_WALLET_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            wallet_address: string;
            target_wallet_address: string;
            target_firefly_account_id?: string;
            amount: number;
            currency: string;
            amount_usd: number;
            chain_id: number;
        };
    };
    [EventId.FIREFLY_WALLET_TXN_CALL]: {
        type: EventType.Interact;
        parameters: {
            txn_type: 'transfer' | 'mint' | 'swap' | 'other';
            firefly_account_id: string;
            firefly_wallet_address: string;
            use_firefly_transfer: boolean;
            recipient_type: 'social_user' | 'onchain_address';
            recipient_social_handle?: string;
        };
    };
    [EventId.FIREFLY_WALLET_GENERAL_TRANSACTION_SUBMIT]: {
        type: EventType.Interact;
        parameters: {
            txn_type: 'transfer' | 'mint' | 'swap' | 'other';
            txn_network: 'evm' | 'solana';
            txn_hash: string;
            txn_status: 'success' | 'failed';
            txn_failed_reason?: string;
            firefly_account_id: string;
            firefly_wallet_address: string;
            target_firefly_account_id?: string;
            to_address: string;
            use_firefly_transfer?: boolean;
            recipient_type?: 'social_user' | 'onchain_address';
            recipient_social_handle?: string;
            token_type?: 'native_token' | 'erc20_token' | 'erc721' | 'erc1155' | 'spl_token';
            token_address?: string;
            token_symbol?: string;
            token_name?: string;
            token_amount?: number;
            amount_usd?: number;
            collection_name?: string;
        };
    };
    [EventId.FIREFLY_WALLET_SEND_RECIPIENT_SELECT]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            recipient_chain: string;
            recipient_type: 'social_user' | 'onchain_address';
            recipient_firefly_account_id?: string;
            recipient_social_handle?: string; // only recipient_type === 'social_user'
            target_wallet_address: string;
            recipient_ens?: string;
        };
    };
    [EventId.FIREFLY_WALLET_SEND_RECIPIENT_CHANGE_WALLET_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            recipient_firefly_account_id?: string;
            recipient_social_handle?: string;
        };
    };
    [EventId.FIREFLY_WALLET_SEND_RECIPIENT_CHANGE_WALLET_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            recipient_firefly_account_id?: string;
            recipient_social_handle?: string;
        };
    };
    [EventId.FIREFLY_WALLET_SEND_RECIPIENT_WALLET_CHANGE]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            recipient_firefly_account_id?: string;
            recipient_social_handle?: string;
            target_wallet_address: string;
        };
    };
    [EventId.FIREFLY_WALLET_TRANSACTIONS_TAB_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
}

export abstract class Provider<
    Events extends Record<EventId, Event>,
    Exceptions extends Record<ExceptionId, Exception>,
> {
    abstract captureEvent<T extends EventId>(name: EventId, parameters: Events[T]['parameters']): Promise<void>;
    abstract captureException<T extends ExceptionId>(name: ExceptionId, error: Exceptions[T]['error']): Promise<void>;
}
