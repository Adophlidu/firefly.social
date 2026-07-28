import { type LoaderContext, useLoaderData } from '@dimensiondev/ssr';

import { getPredictionCategoryPageData } from '@/app/[locale]/(normal)/prediction/category/[...slugs]/getPredictionCategoryPageData.js';
import { PredictionCategoryPage } from '@/components/Prediction/Category/PredictionCategoryPage.js';
import { resolveRequestLocale } from '@/helpers/resolveRequestLocale.js';

export const config = { cache: { sMaxAge: 60 } };

interface PredictionCategoryLoaderData {
    slugs: string[];
    slugList: Awaited<ReturnType<typeof getPredictionCategoryPageData>>['slugList'];
    initialPropsListPage: Awaited<ReturnType<typeof getPredictionCategoryPageData>>['initialPropsListPage'];
}

export async function loader({ params, request }: LoaderContext): Promise<PredictionCategoryLoaderData> {
    const slugs = params['*'] ? params['*'].split('/') : [];
    const locale = resolveRequestLocale(request);
    const { slugList, initialPropsListPage } = await getPredictionCategoryPageData(slugs, locale);
    return { slugs, slugList, initialPropsListPage };
}

export default function PredictionCategoryRoute() {
    const { slugs, slugList, initialPropsListPage } =
        useLoaderData<PredictionCategoryLoaderData>('prediction/category/$.tsx');
    return <PredictionCategoryPage slugs={slugs} slugList={slugList} initialPropsListPage={initialPropsListPage} />;
}
