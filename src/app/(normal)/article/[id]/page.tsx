import type { Metadata } from 'next';

import { ArticleDetailPage } from '@/app/(normal)/article/[id]/pages/DetailPage.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { createArticleMetadata } from '@/providers/firefly/metadatas/createArticleMetadata.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ id: string }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id } = await props.params;
    return createArticleMetadata(id, `/article/${id}`);
}

export default async function Page(props: Props) {
    await setupLocaleForSSR();

    const { id } = await props.params;
    return <ArticleDetailPage id={id} />;
}
