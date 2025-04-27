import { ProfileSourceInURL } from '@/constants/enum.js';
import { notFound, redirect, RedirectType } from '@/esm/navigation/server.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveProfileSourceFromUrl } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/index.js';

export default async function Page(props: NextPageProps<{ source: ProfileSourceInURL; id: string }>) {
    const params = await props.params;
    const id = params.id;
    const source = resolveProfileSourceFromUrl(params.source);
    if (!source || !isProfilePageSource(source)) notFound();
    redirect(getProfileUrl({ source, profileId: id, handle: id }), RedirectType.replace);
}
