import type { SocialSourceInURL } from '@dimensiondev/enums';
import { type HeadContext, type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';
import { Trans } from '@lingui/react/macro';

import { PageDetail } from '@/app/[locale]/(normal)/post/[source]/[id]/(detail)/client.js';
import type { PostThreadQueryData } from '@/app/[locale]/(normal)/post/[source]/[id]/(detail)/query.js';
import { Comeback } from '@/components/Comeback.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { Loading } from '@/components/Loading.js';
import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { isValidPostId } from '@/helpers/postId.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { createPostMetadataFromPost } from '@/providers/firefly/metadata/createPostMetadataFromPost.js';
import { getPostDetailPageData } from '@/providers/firefly/metadata/getPostDetailPageData.js';
import type { Post } from '@/providers/types/SocialMedia.js';

/** Shown in the page area while this route's data is in flight (layouts keep rendering). */
export const loadingComponent = () => (
    <div className="flex min-h-[50vh] items-center justify-center">
        <Loading minHeight={200} />
    </div>
);


export const config = { cache: { sMaxAge: 300 } };

interface PostDetailLoaderData {
    id: string;
    source: ReturnType<typeof resolveSocialSource>;
    sourceInURL: string;
    post: Post | null;
    initialThread: PostThreadQueryData | undefined;
    unauthorized: boolean;
}

export async function loader({ params }: LoaderContext): Promise<PostDetailLoaderData> {
    const sourceInURL = params.source!;
    if (!isSocialSourceInUrl(sourceInURL as SocialSourceInURL)) notFound();

    const source = resolveSocialSource(sourceInURL as SocialSourceInURL);
    if (!isValidPostId(source, params.id!)) notFound();

    const { post, unauthorized, initialThread } = await getPostDetailPageData(source, params.id!);

    if (!post && !unauthorized && !isRequestedLoginSource(source)) notFound();

    return {
        id: params.id!,
        source,
        sourceInURL,
        post: post ?? null,
        initialThread,
        unauthorized,
    };
}

export function head({ data, params }: HeadContext) {
    const { sourceInURL, post } = (data ?? {}) as Partial<PostDetailLoaderData>;
    const source = sourceInURL ?? params.source ?? '';
    const id = params.id ?? '';
    const pathname = `/post/${source}/${id}`;
    // Derived from loader data — no second fetch, no floating promise.
    if (post && isSocialSourceInUrl(source as SocialSourceInURL)) {
        return fromNextMetadata(createPostMetadataFromPost(source as SocialSourceInURL, id, post, pathname));
    }
    return fromNextMetadata(createSiteMetadata(pathname));
}

export default function PostDetailPage() {
    const { id, source, post, initialThread, unauthorized } = useLoaderData<PostDetailLoaderData>();

    if (!post && !unauthorized) {
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

    return <PageDetail id={id} source={source} initialPost={post} initialThread={initialThread} />;
}
