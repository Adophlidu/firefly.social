export interface IframeBlockCheckResult {
    url: string;
    isBlocked: boolean;
    xFrameOptions?: string;
    contentSecurityPolicy?: string;
}
