export type ExceptionTags = {
    /** Handler name */
    handler?: string;
} & Record<string, string | number | boolean>;

export interface ExceptionPayload {
    message: string;
    exception_type?: string;
    service_name?: string;
    stack_trace?: string;
    timestamp?: string;
    severity?: 'error' | 'warning' | 'critical';
    ip_address?: string;

    // version
    release_version?: string;

    // environment
    environment?: string;
    vercel_environment?: string;

    // user agent
    os?: string;
    browser?: string;
    user_agent?: string;
    commit_hash?: string;

    // urls
    root_url?: string;
    site_url?: string;
    frame_server_url?: string;
    request_url?: string;

    // vercel region
    ip_timezone?: string;
    ip_city?: string;
    ip_country?: string;
    ip_region?: string;

    // social login parameters
    user_id?: string;
    twitter_username?: string;
    lens_handle?: string;
    farcaster_id?: string;
    bsky_id?: string;

    // wallet parameters
    evm_wallet_address?: string;
    solana_wallet_address?: string;

    // tags
    tags?: ExceptionTags;
}

export interface ExceptionServerPayload {
    message: string;
    request_url?: string;
    stack_trace?: string;
    severity?: 'error' | 'warning' | 'critical';
}
