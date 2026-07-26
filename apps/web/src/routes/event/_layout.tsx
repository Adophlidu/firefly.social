import type { ReactNode } from 'react';

import { EventLayoutBody } from '@/app/[locale]/(event)/EventLayoutBody.js';

/**
 * Port of the Next (event) group layout
 * (src/app/[locale]/(event)/layout.tsx). The root layout's AppLayoutBody
 * already provides the full provider tree, so this layout only renders the
 * event frame (sidebar, search bars, asides) around children — nesting
 * AppProviders here would re-run provider side effects.
 */
export default function EventLayout({ children }: { children?: ReactNode }) {
    return <EventLayoutBody>{children}</EventLayoutBody>;
}
