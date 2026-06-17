import { IS_PRODUCTION } from '@dimensiondev/constants';
import { SITE_URL_OFFICIAL } from '@dimensiondev/constants/static';
import type { MetadataRoute } from 'next';

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
                disallow: ['/settings', '/bookmarks', '/notifications', '/intent', '/auth'],
            },
        ],
        sitemap: `${SITE_URL_OFFICIAL}/sitemap/index.xml`,
    };
}
