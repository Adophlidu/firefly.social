import { RelationContentList } from '@/app/(normal)/profile/pages/RelationContentList.js';
import { type ProfileCategory, type ProfilePageSourceInURL } from '@/constants/enum.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ id: string; category: ProfileCategory; source: ProfilePageSourceInURL }> {}

export default async function Page(props: Props) {
    const params = await props.params;
    if (!params.category) return null;

    return <RelationContentList category={params.category} />;
}
