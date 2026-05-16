import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import type { Context } from 'hono';

import type { IframeBlockCheckResult } from '@/iframe-blocker/src/types.js';

const FIREFLY_DOMAIN = 'firefly.social';

/**
 * Checks if a Content-Security-Policy header blocks iframe embedding for a specific domain
 * @param cspHeader The Content-Security-Policy header value
 * @param domain The domain to check against (e.g., 'firefly.social')
 * @returns boolean indicating if the domain is blocked
 */
function checkCspFrameAncestors(cspHeader: string, domain: string): boolean {
    // Parse the CSP header to find frame-ancestors directive
    const directives = cspHeader.split(';').map((d) => d.trim());

    for (const directive of directives) {
        if (directive.toLowerCase().startsWith('frame-ancestors')) {
            const sources = directive.split(/\s+/).slice(1);

            // If frame-ancestors is present, check if it blocks the domain
            if (sources.includes("'none'")) {
                return true; // 'none' blocks all domains
            }

            // Check if the specific domain or wildcard is explicitly allowed
            const isDomainAllowed = sources.some((source) => {
                // Exact match
                if (source === domain) return true;

                // Wildcard match for subdomains
                if (source === `*.${domain}`) return true;

                // Check if it's a wildcard that could match our domain
                if (source.includes('*')) {
                    const pattern = source.replace(/\*/g, '.*');
                    const regex = new RegExp(`^${pattern}$`);
                    return regex.test(domain) || regex.test(`*.${domain}`);
                }

                return false;
            });

            // If 'self' is present but our domain is not explicitly allowed, it's blocked
            if (sources.includes("'self'") && !isDomainAllowed) {
                return true;
            }

            // If frame-ancestors is present but doesn't explicitly allow our domain, it's blocked
            return !isDomainAllowed;
        }
    }

    // If no frame-ancestors directive is present, iframe embedding is allowed
    return false;
}

/**
 * Checks if a URL's HTTP headers block iframe embedding for Firefly domains
 * @param url The URL to check
 * @param c Hono context for making HTTP requests
 * @returns Promise<IframeBlockCheckResult>
 */
export async function checkIframeBlocking(url: string, c: Context): Promise<IframeBlockCheckResult> {
    try {
        // Make a HEAD request to get headers without downloading the full content
        const response = await fetchWithContext(url, {
            method: 'HEAD',
            context: c,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const headers = response.headers;
        const xFrameOptions = headers.get('X-Frame-Options');
        const contentSecurityPolicy = headers.get('Content-Security-Policy');

        // Check if X-Frame-Options blocks iframe embedding
        const isXFrameOptionsBlocking = !!(
            xFrameOptions &&
            (xFrameOptions.toLowerCase() === 'deny' || xFrameOptions.toLowerCase() === 'sameorigin')
        );

        // Check if Content-Security-Policy blocks iframe embedding for Firefly domains
        const isCspBlocking = !!(
            contentSecurityPolicy && checkCspFrameAncestors(contentSecurityPolicy, FIREFLY_DOMAIN)
        );

        const isBlocked = isXFrameOptionsBlocking || isCspBlocking;

        return {
            url,
            isBlocked,
            xFrameOptions: xFrameOptions || undefined,
            contentSecurityPolicy: contentSecurityPolicy || undefined,
        };
    } catch (error) {
        throw new Error(
            `Failed to check iframe blocking headers for ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}
