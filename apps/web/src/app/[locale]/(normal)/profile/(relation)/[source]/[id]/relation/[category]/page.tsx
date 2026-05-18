import type { ProfileCategory, ProfilePageSourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';

import { RelationContentList } from '@/app/[locale]/(normal)/profile/pages/RelationContentList.js';

interface Props extends LayoutProps<{ id: string; category: ProfileCategory; source: ProfilePageSourceInURL }> {}

export default async function Page(props: Props) {
    const params = await props.params;
    if (!params.category) return null;

    return <RelationContentList category={params.category} />;
}
