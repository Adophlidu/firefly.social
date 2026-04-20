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

/** String = substring match (includes), RegExp = regex test */
export type IgnoredErrorPattern = string | RegExp;

export interface ExceptionTrackerConfig {
    /**
     * When `false`, no events are sent (client beacon or server `fetch`).
     * Default is effectively `true` when omitted. Same idea as Sentry’s `enabled`.
     */
    enabled?: boolean;
    getClient?: () => ClientReportConfig | undefined;
    getServer?: () => ServerReportConfig | undefined;
    getUserContext?: () => UserContext;
    /** Error message patterns to ignore. Strings use substring match; RegExp uses regex test. Merged with built-in defaults. */
    ignoredErrors?: IgnoredErrorPattern[];
}

let config: ExceptionTrackerConfig | null = null;

export function configureExceptionTracker(c: ExceptionTrackerConfig): void {
    console.info(`[configureExceptionTracker] set config`, c);
    config = c;
}

export function getExceptionTrackerConfig(): ExceptionTrackerConfig | null {
    return config;
}

/** `false` only when `configureExceptionTracker({ enabled: false })`; omitted or `true` allows sending. */
export function isExceptionTrackerEnabled(): boolean {
    return getExceptionTrackerConfig()?.enabled !== false;
}
