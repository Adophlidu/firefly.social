import type { LayoutProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { ArticleDetailPage } from '@/app/[locale]/(normal)/article/[id]/pages/DetailPage.js';
import { getArticleDetailPageMetadata } from '@/providers/firefly/metadata/getArticleDetailPageMetadata.js';

export const revalidate = 300;

interface Props extends LayoutProps<{ id: string }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id } = await props.params;
    return getArticleDetailPageMetadata(id, `/article/${id}`);
}

export default async function Page(props: Props) {
    const { id } = await props.params;
    return <ArticleDetailPage id={id} />;
}
