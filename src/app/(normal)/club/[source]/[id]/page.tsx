import type { SocialSourceInURL } from '@/constants/enum.js';
import { notFound, redirect, RedirectType } from '@/esm/navigation/server.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        id: string;
        source: SocialSourceInURL;
    }> {}

export default async function Page(props: Props) {
    const params = await props.params;
    const id = params.id;
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!id || !source || !isSocialSource(source)) notFound();

    redirect(resolveChannelUrl(id, source), RedirectType.replace);
}
