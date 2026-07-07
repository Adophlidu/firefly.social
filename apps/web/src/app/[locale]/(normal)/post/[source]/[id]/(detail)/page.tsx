import type { SocialSourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { Trans } from '@lingui/react/macro';

import { PageDetail } from '@/app/[locale]/(normal)/post/[source]/[id]/(detail)/client.js';
import { getPostDetailPageData } from '@/providers/firefly/metadata/getPostDetailPageData.js';
import { Comeback } from '@/components/Comeback.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { notFound } from '@/esm/navigation/server.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { isValidPostId } from '@/helpers/postId.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

export const revalidate = 60;

interface Props extends LayoutProps<{ id: string; source: SocialSourceInURL; locale: string }> {}

export default async function Page(props: Props) {
    const params = await props.params;
    setupLocaleFromParams(params.locale);
    if (!isSocialSourceInUrl(params.source)) notFound();

    const source = resolveSocialSource(params.source);

    if (!isValidPostId(source, params.id)) {
        notFound();
    }

    const { post, unauthorized, initialThread } = await getPostDetailPageData(source, params.id);

    if (!post && !unauthorized) {
        if (isRequestedLoginSource(source)) {
            return (
                <article className="min-h-screen">
                    <header className="sticky top-0 z-40 flex items-center bg-primaryBottom px-4 py-[18px]">
                        <Comeback className="mr-8" />
                        <h2 className="text-xl font-black leading-6">
                            <Trans>Sign in to unlock</Trans>
                        </h2>
                    </header>
                    <NotLoginFallback source={source} />
                </article>
            );
        }
        notFound();
    }

    return <PageDetail id={params.id} source={source} initialPost={post ?? null} initialThread={initialThread} />;
}
