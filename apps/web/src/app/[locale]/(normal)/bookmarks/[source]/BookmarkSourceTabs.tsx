'use client';

import { Source } from '@dimensiondev/enums';
import { SolidSourceTabs } from '@/components/Tabs/SolidSourceTabs.js';
import { BOOKMARK_SOURCES } from '@/constants/computed.js';
import type { BookmarkSource } from '@/constants/enum.js';
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
            sources={BOOKMARK_SOURCES.map((s) => ({
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
