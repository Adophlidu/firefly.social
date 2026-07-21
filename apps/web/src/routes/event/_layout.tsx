import type { ReactNode } from 'react';

import { AppProviders } from '@/compat/AppProviders.js';

/**
 * Layout for non-locale event routes. The Next (event) group relies on the
 * RSC-level lingui context; the SSR library has no equivalent, so provide
 * the full provider tree explicitly (event pages are English-only).
 */
export default function EventLayout({ children }: { children?: ReactNode }) {
    return <AppProviders locale="en">{children}</AppProviders>;
}
