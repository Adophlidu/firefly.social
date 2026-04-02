'use client';

import { SolidSourceTabs } from '@/components/Tabs/SolidSourceTabs.js';
import { BOOKMARK_SOURCES } from '@/constants/computed.js';
import { type BookmarkSource, Source } from '@/constants/enum.js';
import { NFT_ENABLED } from '@/constants/static.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';
import { captureBookmarkTabClick } from '@/providers/telemetry/captureBookmarkTabEvent.js';
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
                captureBookmarkTabClick(source as BookmarkSource);
                if (source === Source.Tokens) captureBookmarkTokenViewEvent('direct');
            }}
        />
    );
}
