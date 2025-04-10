import { GroupContentList } from '@/app/(normal)/group/[id]/[type]/pages/GroupContentList.js';
import type { GroupTabType } from '@/constants/enum.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string; type: GroupTabType }> {}

export default async function GroupPage(props: Props) {
    await setupLocaleForSSR();
    const param = await props.params;

    return <GroupContentList type={param.type} />;
}
