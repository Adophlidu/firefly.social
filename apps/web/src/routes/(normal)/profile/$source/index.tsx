import { type HeadContext, type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { isNumericalProfileId as isUID } from '@/helpers/isNumericalProfileId.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { RedirectProfilePage } from '@/legacy/[locale]/(normal)/profile/pages/RedirectProfilePage.js';
import { RedirectWithFireflyUID } from '@/legacy/[locale]/(normal)/profile/pages/RedirectWithFireflyUID.js';
import { getFireflyProfilePageMetadata } from '@/providers/firefly/metadata/getFireflyProfilePageMetadata.js';

interface ProfileSourceLoaderData {
    kind: 'uid' | 'source';
    uid?: string;
    source?: Parameters<typeof RedirectProfilePage>[0]['source'];
}

export function loader({ params }: LoaderContext): ProfileSourceLoaderData {
    const source = params.source!;
    if (isUID(source)) return { kind: 'uid', uid: source };
    const resolvedSource = resolveSourceFromUrlNoFallback(source);
    if (!resolvedSource || !isSocialSource(resolvedSource)) notFound();
    return { kind: 'source', source: resolvedSource };
}

export async function head({ params }: HeadContext) {
    return fromNextMetadata(
        await getFireflyProfilePageMetadata(params.source ?? '', `/profile/${params.source ?? ''}`),
    );
}

export default function ProfileSourcePage() {
    const data = useLoaderData<ProfileSourceLoaderData>();
    if (data.kind === 'uid') return <RedirectWithFireflyUID uid={data.uid!} />;
    return <RedirectProfilePage source={data.source!} />;
}
