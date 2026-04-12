'use client';

import { memo, useEffect } from 'react';

import { ClickableArea } from '@/components/ClickableArea.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { PageRoute } from '@/constants/enum.js';
import { useRouter } from '@/esm/navigation.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { useEverSeen } from '@/hooks/useEverSeen.js';

export const Hashtag = memo<Omit<MarkupLinkProps, 'post'>>(function Hashtag({ title, source }) {
    const router = useRouter();
    const [viewed, ref] = useEverSeen<HTMLDivElement>();

    useEffect(() => {
        if (title && viewed) router.prefetch(PageRoute.Search);
    }, [title, router, viewed]);

    if (!title) return null;

    return (
        <ClickableArea
            className="text-highlight cursor-pointer hover:underline"
            as="span"
            ref={ref}
            onClick={() => {
                scrollTo(0, 0);
                router.push(resolveSearchUrl(title, undefined, source));
            }}
        >
            {title}
        </ClickableArea>
    );
});
