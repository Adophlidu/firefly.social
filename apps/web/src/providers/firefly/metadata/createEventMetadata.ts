import type { Metadata } from 'next';

import { getEventPageMetadata } from '@/helpers/getEventPageData.js';

export async function createEventMetadata(
    eventName: string,
    pathname: string,
    replaceName?: string,
): Promise<Metadata> {
    return getEventPageMetadata(eventName, pathname, replaceName);
}
