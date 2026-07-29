import type { ReactNode } from 'react';

import { FeedErrorBoundary } from '@/components/FeedErrorBoundary.js';
import { EventLayoutBody } from '@/legacy/[locale]/(event)/EventLayoutBody.js';

/**
 * Event group frame (the old (event) group layout): EventLayoutBody with its
 * own sidebar/search asides around /event/* and /events, inside the same
 * centered container the site frame uses. Providers come from the root
 * AppLayoutBody.
 */
export default function EventGroupLayout({ children }: { children?: ReactNode }) {
    return (
        <div className="m-auto flex w-full md:min-h-screen lg:w-[1265px]">
            <EventLayoutBody>
                <FeedErrorBoundary>{children}</FeedErrorBoundary>
            </EventLayoutBody>
        </div>
    );
}
