import { ChannelContentListPage } from '@/app/(normal)/channel/pages/ChannelContentListPage.js';
import { ChannelTabType } from '@/constants/enum.js';
import { isBotRequest } from '@/helpers/isBotRequest.js';
import type { NextPageProps } from '@/types/index.js';

interface Props
    extends NextPageProps<{
        id: string;
        type: ChannelTabType;
    }> {}

export default async function Page(props: Props) {
    if (await isBotRequest()) return null;
    const params = await props.params;
    return <ChannelContentListPage type={params.type} />;
}
