import { useParams } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { ActivityProvider } from '@/components/Activity/ActivityContext.js';

/**
 * Port of the Next event detail layout
 * (src/app/[locale]/(event)/event/[name]/layout.tsx): provide the activity
 * name to every page under /event/event/$name.
 */
export default function EventNameLayout({ children }: { children?: ReactNode }) {
    const params = useParams();
    return <ActivityProvider name={params.name!}>{children}</ActivityProvider>;
}
