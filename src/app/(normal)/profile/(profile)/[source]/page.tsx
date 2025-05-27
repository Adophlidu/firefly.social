import { RedirectProfilePage } from '@/app/(normal)/profile/pages/RedirectProfilePage.js';
import { RedirectWithFireflyUID } from '@/app/(normal)/profile/pages/RedirectWithFireflyUID.js';
import { type ProfileSourceInURL } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation.js';
import { isNumericalProfileId as isUID } from '@/helpers/isNumericalProfileId.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ source: ProfileSourceInURL }> {}

export default async function Page(props: Props) {
    const params = await props.params;
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (isUID(params.source)) {
        return <RedirectWithFireflyUID uid={params.source} />;
    }
    if (!source || !isSocialSource(source)) notFound();
    return <RedirectProfilePage source={source} />;
}
