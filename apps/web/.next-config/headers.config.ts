import { type NextConfig } from 'next';

export const headersConfig: NonNullable<NextConfig['headers']> = async () => {
    // Get the site URL for the payment method manifest Link header
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://firefly.social';

    return [
        {
            source: '/(.*)?', // Matches all pages
            headers: [
                {
                    key: 'Referrer-Policy',
                    value: 'origin-when-cross-origin',
                },
                {
                    key: 'Strict-Transport-Security',
                    value: 'max-age=63072000; includeSubDomains; preload',
                },
                {
                    key: 'X-Frame-Options',
                    value: process.env.NODE_ENV === 'development' ? 'DENY' : 'SAMEORIGIN',
                },
                {
                    key: 'X-Content-Type-Options',
                    value: 'nosniff', // Prevent MIME type sniffing
                },
                {
                    key: 'X-XSS-Protection',
                    value: '1; mode=block', // Prevent rendering
                },
                {
                    key: 'Link',
                    value: `<${siteUrl}/.well-known/payment-method-manifest.json>; rel="payment-method-manifest"`,
                },
                // Note: CSP is now handled by middleware (proxy.ts) with nonce support
                // The middleware will set Content-Security-Policy-Report-Only with nonce
                // This allows inline scripts to work with CSP
            ],
        },
        {
            source: '/next-debug.log',
            headers: [
                {
                    key: 'Cache-Control',
                    value: 'public, max-age=0, must-revalidate',
                },
            ],
        },
    ];
};
