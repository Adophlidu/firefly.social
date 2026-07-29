import type { ProfileCategory } from '@dimensiondev/enums';
import { useParams } from '@dimensiondev/ssr';

import { RelationContentList } from '@/legacy/[locale]/(normal)/profile/pages/RelationContentList.js';

export default function ProfileRelationPage() {
    const params = useParams();
    if (!params.category) return null;
    return <RelationContentList category={params.category as ProfileCategory} />;
}
