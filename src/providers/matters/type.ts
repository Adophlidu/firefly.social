export interface MattersArticleDetail {
    short_hash: string;
    summary: string;
    content: string;
    slug: string;
    created_at: string;
    author: {
        username: string;
        avatar: string;
        address: string;
        display_name: string;
        account_id: string;
        _id: string;
        type: string;
    };
    is_like: boolean;
    like_count: number;
}
