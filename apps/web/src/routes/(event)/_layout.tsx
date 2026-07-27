import type { ReactNode } from 'react';

import { EventLayoutBody } from '@/app/[locale]/(event)/EventLayoutBody.js';

/**
 * Event group frame (the old (event) group layout): EventLayoutBody with its
 * own sidebar/search asides around /event/* and /events. Providers come from
 * the root AppLayoutBody.
 */
export default function EventGroupLayout({ children }: { children?: ReactNode }) {
    return <EventLayoutBody>{children}</EventLayoutBody>;
}
