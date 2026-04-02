'use client';

import { useSearchParams } from 'next/navigation.js';
import { useEffect } from 'react';

import { ShareLinkPage } from '@/app/[locale]/(normal)/intent/compose/pages/ShareLinkPage.js';
import { DEFAULT_SOCIAL_SOURCE } from '@/constants/computed.js';
import { useRouter } from '@/esm/navigation.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { trimify } from '@/helpers/trimify.js';

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
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
