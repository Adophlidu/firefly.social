import { DEFAULT_SOCIAL_SOURCE } from '@dimensiondev/constants/computed';
import { useSearch } from '@dimensiondev/ssr';
import { useEffect } from 'react';

import { ShareLinkPage } from '@/legacy/[locale]/(normal)/intent/compose/pages/ShareLinkPage.js';
import { useRouter } from '@/esm/navigation.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { trimify } from '@/helpers/trimify.js';

export default function IntentComposePage() {
    const router = useRouter();
    const searchParams = useSearch();
    const text = searchParams.get('text') || '';
    const url = searchParams.get('url') || '';
    const via = searchParams.get('via') || '';

    useEffect(() => {
        if (!trimify(text)) {
            router.replace(resolveDiscoverUrl(DEFAULT_SOCIAL_SOURCE));
        }
    }, [text, router]);

    if (!trimify(text)) return null;

    return <ShareLinkPage text={text} url={url} via={via} />;
}
