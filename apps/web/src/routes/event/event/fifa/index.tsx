import { WorldCupModal } from '@/components/WorldCup/WorldCupModal.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function head() {
    const description =
        'Back your favorite team on Firefly and turn your soccer insights into real rewards with a massive $50,000 prize pool!';
    return {
        title: 'FIFA Prediction Festival',
        meta: [
            { name: 'description', content: description },
            { property: 'og:type', content: 'website' },
            { property: 'og:url', content: 'https://firefly.social/event/fifa' },
            { property: 'og:title', content: 'FIFA Prediction Festival' },
            { property: 'og:description', content: description },
            {
                property: 'og:image',
                content: 'https://media.firefly.land/upload/2eee5327-5751-491d-98f6-e70707f31f19.png',
            },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: 'FIFA Prediction Festival' },
            { name: 'twitter:description', content: description },
        ],
    };
}

export default function FifaPage() {
    return <WorldCupModal />;
}
