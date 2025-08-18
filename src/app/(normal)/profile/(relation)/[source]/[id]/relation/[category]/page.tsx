import { RelationContentList } from '@/app/(normal)/profile/pages/RelationContentList.js';
import { type ProfileCategory, type ProfileSourceInURL } from '@/constants/enum.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ id: string; category: ProfileCategory; source: ProfileSourceInURL }> {}

export default async function Page(props: Props) {
    const params = await props.params;
    if (!params.category) return null;

    return <RelationContentList category={params.category} />;
}
