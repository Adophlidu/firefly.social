import type { SocialSourceInURL } from '@dimensiondev/enums';
import type { Metadata } from 'next';

import { getPostPageMetadata } from '@/helpers/getPostPageMetadata.js';

export async function createPostMetadata(
    source: string,
    postId: string,
    pathname: string,
    searchParams?: Record<string, string | string[] | undefined>,
): Promise<Metadata> {
    return getPostPageMetadata(source as SocialSourceInURL, postId, pathname, {
        s: searchParams?.s as string | undefined,
        sid: searchParams?.sid as string | undefined,
    });
}
