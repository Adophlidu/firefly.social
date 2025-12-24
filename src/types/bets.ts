export interface BetsProfileDataForUI {
    balance: number;
    cash_balance: number;
    notfill_balance: number;
    platform_name: string;
    platform_avatar: string;
    pnl: number;
    proxy: string;
    wallet: string;
    tags?: string[];
    position_traded?: number;
    win_rate?: number;
    losses?: number;
    gains?: number;
    volume?: number;
}

export interface BetsPositionDataForUI {
    parent_title?: string;
    title?: string;
    vote_status: string;
    event_slugs: string[];
    Id: string;
    image?: string;
    shares: number;
    avg_price: number;
    cur_price: number;
    pnl: number;
    pnl_rate: number;
    total_buy: number;
    IsClaim: boolean;
    is_closed: boolean;
    topicId?: number;
    is_mutil?: number;
}
