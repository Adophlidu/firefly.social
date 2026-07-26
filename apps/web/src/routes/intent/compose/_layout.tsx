import { DEFAULT_SOCIAL_SOURCE, DISCOVER_SOURCES } from '@dimensiondev/constants/computed';
import type { ReactNode } from 'react';

import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';

/**
 * Port of the Next intent compose layout
 * (src/app/[locale]/(normal)/intent/compose/layout.tsx): discover source tabs
 * above the compose page.
 */
export default function IntentComposeLayout({ children }: { children?: ReactNode }) {
    return (
        <>
            <SourceTabs>
                {DISCOVER_SOURCES.map((x) => (
                    <SourceTab key={x} href={resolveDiscoverUrl(x)} isActive={x === DEFAULT_SOCIAL_SOURCE}>
                        {resolveSourceName(x)}
                    </SourceTab>
                ))}
            </SourceTabs>
            {children}
        </>
    );
}
