'use client';

import { SolidSourceTabs } from '@/components/Tabs/SolidSourceTabs.js';
import { type BookmarkSource, Source } from '@/constants/enum.js';
import { BOOKMARK_SOURCES, NFT_ENABLED } from '@/constants/index.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';
import { captureBookmarkTokenViewEvent } from '@/providers/telemetry/captureTokenEvent.js';

interface Props {
    source: BookmarkSource;
}

export function BookmarkSourceTabs({ source }: Props) {
    return (
        <SolidSourceTabs
            active={source}
            sources={BOOKMARK_SOURCES.filter((x) => (NFT_ENABLED ? true : x !== Source.NFTs)).map((s) => ({
                source: s,
                link: resolveBookmarkUrl(s),
            }))}
            onChange={(source) => {
                if (source === Source.Tokens) captureBookmarkTokenViewEvent('direct');
            }}
        />
    );
}
