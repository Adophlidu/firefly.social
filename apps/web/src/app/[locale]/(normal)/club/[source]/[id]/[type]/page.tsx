import type { ChannelTabType, SocialSourceInURL } from '@dimensiondev/enums';
import { Source, SourceInURL } from '@dimensiondev/enums';
import type { LayoutProps, SearchProps } from '@dimensiondev/types';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import type { Metadata } from 'next';

import { getChannelPageData } from '@/app/[locale]/(normal)/club/[source]/[id]/getChannelPageData.js';
import { ChannelContentList } from '@/components/Channel/ChannelContentList.js';
import { ChannelProvider } from '@/components/Channel/ChannelProvider.js';
import { NoSSR } from '@/components/NoSSR.js';
import { notFound } from '@/esm/navigation/server.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { createChannelMetadata } from '@/providers/firefly/metadata/createChannelMetadata.js';

export const revalidate = 60;

type Props = LayoutProps<{
    id: string;
    source: SocialSourceInURL;
    type: ChannelTabType;
}> &
    SearchProps<{
        source: SocialSourceInURL;
    }>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source = SourceInURL.Farcaster, id } = await props.params;
    return createChannelMetadata(source, id, `/club/${source}/${id}`);
}

export default async function Page(props: Props) {
    const { source, id, type } = await props.params;
    const resolvedSource = resolveSocialSource(source);

    if (resolvedSource === Source.Lens && !isValidAddressEthereum(id)) notFound();

    const channel = await getChannelPageData(source, id);
    if (!channel) notFound();

    return (
        <NoSSR>
            <ChannelProvider channel={channel}>
                <ChannelContentList type={type} channel={channel} />
            </ChannelProvider>
        </NoSSR>
    );
}
