export interface UserContext {
    user_id?: string;
    twitter_username?: string;
    lens_handle?: string;
    farcaster_id?: string;
    bsky_id?: string;
}

export interface ClientReportConfig {
    version?: string;
    commitHash?: string;
    environment: string;
    vercelEnvironment?: string;
    beaconUrl: string;
    serviceName?: string;
    getBom: () => {
        navigator?: Navigator | null;
        location?: Location | null;
        window?: (Window & Record<string, unknown>) | null;
    };
    getUrls: () => {
        rootUrl?: string;
        siteUrl?: string;
        frameServerUrl?: string;
    };
}

export interface ServerReportConfig {
    baseUrl: string;
    version?: string;
    commitHash?: string;
    environment: string;
    vercelEnvironment?: string;
    serviceName?: string;
}

export interface ExceptionTrackerConfig {
    getClient?: () => ClientReportConfig | undefined;
    getServer?: () => ServerReportConfig | undefined;
    getUserContext?: () => UserContext;
}

let config: ExceptionTrackerConfig | null = null;

export function configureExceptionTracker(c: ExceptionTrackerConfig): void {
    config = c;
}

export function getExceptionTrackerConfig(): ExceptionTrackerConfig | null {
    return config;
}
