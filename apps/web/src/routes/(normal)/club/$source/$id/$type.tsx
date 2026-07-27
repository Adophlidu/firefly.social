import type { ChannelTabType, SocialSourceInURL } from '@dimensiondev/enums';
import { Source, SourceInURL } from '@dimensiondev/enums';
import { type HeadContext, type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { ChannelContentList } from '@/components/Channel/ChannelContentList.js';
import { ChannelProvider } from '@/components/Channel/ChannelProvider.js';
import { NoSSR } from '@/components/NoSSR.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { getChannelPageData } from '@/providers/firefly/metadata/getChannelPageData.js';
import { getChannelPageMetadata } from '@/providers/firefly/metadata/getChannelPageMetadata.js';

export const config = { cache: { sMaxAge: 300 } };

interface ClubLoaderData {
    channel: NonNullable<Awaited<ReturnType<typeof getChannelPageData>>>;
    type: ChannelTabType;
}

export async function loader({ params }: LoaderContext): Promise<ClubLoaderData> {
    const { id, type } = params;
    const source = params.source ?? SourceInURL.Farcaster;
    const resolvedSource = resolveSocialSource(source as SocialSourceInURL);

    if (resolvedSource === Source.Lens && !isValidAddressEthereum(id!)) notFound();

    const channel = await getChannelPageData(source as SocialSourceInURL, id!);
    if (!channel) notFound();

    return { channel, type: type as ChannelTabType };
}

export async function head({ params }: HeadContext) {
    const { id, source = SourceInURL.Farcaster } = params;
    return fromNextMetadata(
        await getChannelPageMetadata(source as SocialSourceInURL, id ?? '', `/club/${source}/${id}`),
    );
}

export default function ClubPage() {
    const { channel, type } = useLoaderData<ClubLoaderData>();
    return (
        <NoSSR>
            <ChannelProvider channel={channel}>
                <ChannelContentList type={type} channel={channel} />
            </ChannelProvider>
        </NoSSR>
    );
}
