import type { SocialSourceInURL } from '@dimensiondev/enums';
import type { Metadata } from 'next';

import { getFireflyArticlePageMetadata } from '@/helpers/getFireflyArticlePageMetadata.js';

export async function createFireflyArticleMetadata(
    articleId: string,
    source: SocialSourceInURL,
    pathname: string,
): Promise<Metadata> {
    return getFireflyArticlePageMetadata(articleId, source, pathname);
}
