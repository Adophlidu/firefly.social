import { SITE_NAME } from '@dimensiondev/constants/static';
import type { Metadata } from 'next';

import { WorldCupModal } from '@/components/WorldCup/WorldCupModal.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        metadataBase: 'https://firefly.social/',
        title: 'FIFA Prediction Festival',
        itunes: {
            appId: '1640183078',
        },
        description:
            'Back your favorite team on Firefly and turn your soccer insights into real rewards with a massive $50,000 prize pool!',
        openGraph: {
            type: 'website',
            url: 'https://firefly.social/event/fifa',
            siteName: SITE_NAME,
            title: 'FIFA Prediction Festival',
            description:
                'Back your favorite team on Firefly and turn your soccer insights into real rewards with a massive $50,000 prize pool!',
            images: ['https://media.firefly.land/upload/2eee5327-5751-491d-98f6-e70707f31f19.png'],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'FIFA Prediction Festival',
            description:
                'Back your favorite team on Firefly and turn your soccer insights into real rewards with a massive $50,000 prize pool!',
            images: ['https://media.firefly.land/upload/2eee5327-5751-491d-98f6-e70707f31f19.png'],
        },
        manifest: '/site.webmanifest',
        icons: [
            {
                url: '/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                url: '/android-chrome-384x384.png',
                sizes: '384x384',
                type: 'image/png',
            },
            {
                rel: 'icon',
                url: '/favicon.ico',
            },
            {
                rel: 'apple-touch-icon',
                url: '/apple-touch-icon.png',
            },
        ],
        alternates: {
            canonical: 'https://firefly.social/event/fifa',
        },
    };
}

export default function Page() {
    return <WorldCupModal />;
}
