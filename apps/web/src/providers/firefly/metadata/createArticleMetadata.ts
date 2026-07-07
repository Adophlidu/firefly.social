import type { Metadata } from 'next';

import { getArticleDetailPageMetadata } from '@/app/[locale]/(normal)/article/[id]/getArticleDetailPageData.js';

export async function createArticleMetadata(articleId: string, pathname: string): Promise<Metadata> {
    return getArticleDetailPageMetadata(articleId, pathname);
}
