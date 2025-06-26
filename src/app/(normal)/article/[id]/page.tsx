import type { Metadata } from 'next';

import { ArticleDetailPage } from '@/app/(normal)/article/[id]/pages/DetailPage.js';
import { KeyType } from '@/constants/enum.js';
import { createMetadataArticleById } from '@/helpers/createMetadataArticleById.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

const createPageMetadata = memoizeWithRedis(createMetadataArticleById, {
    key: KeyType.CreateMetadataArticleById,
});

interface Props extends NextPageProps<{ id: string }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id } = await props.params;
    return createPageMetadata(`/article/${id}`, id);
}

export default async function Page(props: Props) {
    await setupLocaleForSSR();

    const { id } = await props.params;
    return <ArticleDetailPage id={id} />;
}
