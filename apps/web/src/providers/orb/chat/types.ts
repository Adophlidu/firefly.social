export type ChannelType = 'dm' | 'club' | 'bot' | 'feedback' | 'group';

export type ChatRequestType = 'other' | 'followers' | 'personIFollow' | 'friends' | null;

export interface UserMetadata {
    id?: string;
    address: string;
    ownedBy?: string;
    name: string | null;
    handle: string | null;
    namespace?: string | null;
    picture?: string | { url?: string } | null;
    rawPicture?: string | null;
}

export interface ChannelMembership {
    id: string;
    channel_id: string;
    user_id: string | null;
    role: string;
    status: string;
    is_pinned: boolean;
    is_muted: boolean;
    is_hidden: boolean;
    is_marked_as_spam: boolean;
    chat_request_type: ChatRequestType;
    unread_count: number;
    last_read_message_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface MediaAttachment {
    __typename: 'MediaImage' | 'MediaVideo' | 'MediaAudio';
    id: string;
    index: number;
    item: string;
    raw?: string | null;
    cover?: string | null;
    type: string;
    duration?: number | null;
    title?: string | null;
    width?: number | null;
    height?: number | null;
    aspectRatio?: number | null;
}

export interface DmAttachmentDraft {
    id: string;
    url: string;
    type: string;
    file?: File;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
}

export interface Sticker {
    id: string;
    type?: 'STICKER_ITEM';
    url?: string | null;
    metadata?: {
        address?: string;
        url?: string | null;
    };
}

export interface ChatMessage {
    id: string;
    channel_id: string;
    author_id: string;
    content: string | null;
    parent_message_id: string | null;
    created_at: string;
    updated_at: string;
    sticker_id: string | null;
    shared_publication_id: string | null;
    offer_id: string | null;
    sale_id: string | null;
    interactive_action_id: string | null;
    author_profile: UserMetadata;
    attachments: MediaAttachment[];
    sticker?: Sticker | null;
    send_status?: 'pending' | 'sent' | 'failed';
    is_optimistic?: boolean;
    pending_attachments?: DmAttachmentDraft[];
    pending_tip?: PendingDmTip;
}

export type DmTipSendStep = 'create' | 'complete' | 'send';

export interface PendingDmTip {
    targetUserId: string;
    amount: number;
    currency: string;
    currencySymbol: string;
    chainId: number;
    nextStep: DmTipSendStep;
}

export interface InteractiveActionDetail {
    amount: number | null;
    currencySymbol: string | null;
    status: string | null;
    message: string | null;
}

export interface ChatChannel {
    id: string;
    name: string;
    channel_type: ChannelType;
    status: string;
    club_id: string | null;
    channel_image_url: string | null;
    channel_cover_image_url: string | null;
    channel_blur_cover_image_url: string | null;
    created_by_user_id: string;
    last_message_at: string | null;
    channel_membership: ChannelMembership;
    other_member_profile: UserMetadata | null;
    total_members: number;
    last_message?: ChatMessage | null;
}

export interface ChannelCounters {
    total_unread_count: number;
    total_channels_count: number;
    total_unread_channels_count: number;
    total_unread_dms_count: number;
    total_unread_clubs_count: number;
    requests_count: number;
}

export interface ChatEnvelope<T> {
    status?: 'SUCCESS' | 'FAILED' | string;
    data?: T;
    msg?: string;
    channelId?: string;
    messageId?: string;
    wasDuplicate?: boolean;
}

export interface ChatRealtimeSession {
    token: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
}

export interface ChatItemsPage<T> {
    items: T[];
}

export interface GetChannelsParams {
    cursor?: number;
    limit?: number;
    type?: ChannelType;
    requestType?: Exclude<ChatRequestType, null>;
    isUnread?: boolean;
    searchText?: string;
}

export interface GetMessagesParams {
    channelId: string;
    cursor?: number;
    limit?: number;
}

export interface SendMessageInput {
    channelId: string;
    messageId: string;
    content?: string;
    attachments?: MediaAttachment[];
    interactiveActionId?: string;
}

export interface CreateDirectTipInput {
    targetUserId: string;
    amount: number;
    currency: string;
    currencySymbol: string;
    chainId: number;
    message?: string;
}

export interface MentionResult {
    id: string;
    handle: string;
    name: string | null;
    avatar: string | null;
}

export interface DmIdentity {
    accessToken: string;
    account: string;
    profileId: string;
}
