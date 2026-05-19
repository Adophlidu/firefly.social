'use client';

import { BOOKMARK_SOURCES } from '@dimensiondev/constants/computed';
import type { BookmarkSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';

import { SolidSourceTabs } from '@/components/Tabs/SolidSourceTabs.js';
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
