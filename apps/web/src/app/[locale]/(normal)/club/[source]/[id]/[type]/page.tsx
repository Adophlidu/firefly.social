import type { LayoutProps, SearchProps } from '@dimensiondev/types';
import { runInSafeAsync } from '@dimensiondev/utils';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import type { Metadata } from 'next';

import { ChannelContentList } from '@/components/Channel/ChannelContentList.js';
import { ChannelProvider } from '@/components/Channel/ChannelProvider.js';
import { NoSSR } from '@/components/NoSSR.js';
import { type ChannelTabType, type SocialSourceInURL, Source, SourceInURL } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
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

    const provider = resolveSocialMediaProvider(resolvedSource);
    const channel = await runInSafeAsync(() => provider.getChannelById(id));

    if (!channel) notFound();

    return (
        <NoSSR>
            <ChannelProvider channel={channel}>
                <ChannelContentList type={type} channel={channel} />
            </ChannelProvider>
        </NoSSR>
    );
}
