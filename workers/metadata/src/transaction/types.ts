import type { TipsNotificationType, WatchType } from '@dimensiondev/enums';

export interface TipsAccountInfo {
    firefly_uid: string;
    firefly_uuid: string;
    firefly_avatar: string;
    firefly_name: string;
}

export interface TipsDetail {
    status: 'success';
    notification_type: TipsNotificationType;
    chain_id: number;
    tx_hash: string;
    height: number;
    timestamp: number;
    from_address: string;
    to_address: string;
    amount: string;
    token_price: string;
    token_symbol: string;
    token_name: string;
    token_icon: string;
    token_address: string;
    token_type: string;
    tips_memos: string;
    has_liked: boolean;
    has_reposted: boolean;
    from_account?: TipsAccountInfo;
    to_account?: TipsAccountInfo;
}

export interface SwapToken {
    logo: string;
    symbol: string;
    amount_usd: string;
    /** ui amount */
    amount_num: string;
    amount_str: string;
    name: string;
    decimal: number;
    price: string;
    address: string;
}

export interface FollowingSource {
    id?: string;
    handle?: string;
    name?: string;
    type: WatchType;
    socialId?: string;
    walletAddress?: `0x${string}`;
}

export interface FireflyDisplayInfo {
    ensHandle: string;
    avatarUrl: string;
    fireflyName: string;
    fireflyUid: string;
    fireflyAvatarUrl: string;
}

export interface SwapActivity {
    owner: string;
    chain_id: number;
    tx_status: string;
    error_msg: string;
    hash: string;
    router_address: string;
    dex_name: string;
    dex_logo: string;
    /** timestamp in seconds */
    timestamp: string;
    block_number: string;
    from_token: SwapToken | null;
    to_token: SwapToken | null;
    source: string;
    like_count: number;
    is_like: boolean;
    is_repost: boolean;
    repost_count: number;
    displayInfo?: FireflyDisplayInfo;
    followingSources: FollowingSource[];
}
