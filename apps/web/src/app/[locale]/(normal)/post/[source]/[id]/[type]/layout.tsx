import { EngagementLayout } from '@/app/[locale]/(normal)/post/[source]/[id]/pages/EngagementLayout.js';
import { type EngagementType } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { isEngagementType } from '@/helpers/parseEngagementUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { type LayoutProps } from '@/types/utility.js';

export const revalidate = 60;

interface Props extends LayoutProps<{ source: string; id: string; type: EngagementType }> {}

export default async function Layout(props: Props) {
    const params = await props.params;
    const { children } = props;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isSocialSource(source)) notFound();

    if (!isEngagementType(params.type)) notFound();

    return (
        <EngagementLayout source={source} id={params.id} type={params.type}>
            {children}
        </EngagementLayout>
    );
}
