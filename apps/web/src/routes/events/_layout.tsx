import type { ReactNode } from 'react';

import { EventLayoutBody } from '@/app/[locale]/(event)/EventLayoutBody.js';

/**
 * Same frame as `event/_layout.tsx` (the Next (event) group covered both
 * /event/* and /events): sidebar, search bars and asides around children.
 */
export default function EventsLayout({ children }: { children?: ReactNode }) {
    return <EventLayoutBody>{children}</EventLayoutBody>;
}
