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
            ],
        };
    }

    // Allow crawling on production
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
            },
        ],
        sitemap: `${SITE_URL_OFFICIAL}/sitemap.txt`,
    };
}
