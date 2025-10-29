import type { MetadataRoute } from 'next';

import { IS_PRODUCTION, SITE_URL_OFFICIAL } from '@/constants/index.js';

export default function robots(): MetadataRoute.Robots {
    // Block everything on staging, preview, testing, etc
    if (!IS_PRODUCTION) {
        return {
            rules: [
                {
                    userAgent: '*',
                    disallow: '/',
                },
                {
                    userAgent: 'Twitterbot',
                    allow: '/',
                },
                {
                    userAgent: 'TelegramBot',
                    allow: '/',
                },
                {
                    userAgent: 'Xbot',
                    allow: '/',
                },
            ],
        };
    }

    // Allow crawling on production
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: '/nft',
            },
        ],
        sitemap: `${SITE_URL_OFFICIAL}/sitemap/index.xml`,
    };
}
