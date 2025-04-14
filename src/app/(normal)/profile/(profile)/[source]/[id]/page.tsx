import { SourceInURL } from '@/constants/enum.js';
import { notFound, redirect, RedirectType } from '@/esm/navigation/server.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/index.js';

export default async function Page(props: NextPageProps<{ source: SourceInURL; id: string }>) {
    const params = await props.params;
    const id = params.id;
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isProfilePageSource(source)) notFound();
    redirect(resolveProfileUrl(source, id), RedirectType.replace);
}
