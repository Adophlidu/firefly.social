import type { SocialSourceInURL } from '@dimensiondev/enums';
import { type HeadContext, type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';
import { Trans } from '@lingui/react/macro';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { Comeback } from '@/components/Comeback.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { isValidPostId } from '@/helpers/postId.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { PageDetail } from '@/legacy/[locale]/(normal)/post/[source]/[id]/(detail)/client.js';
import type { PostThreadQueryData } from '@/legacy/[locale]/(normal)/post/[source]/[id]/(detail)/query.js';
import { createPostMetadataFromPost } from '@/providers/firefly/metadata/createPostMetadataFromPost.js';
import { getPostDetailPageData } from '@/providers/firefly/metadata/getPostDetailPageData.js';
import { findPostInFeedCache } from '@/services/findPostInFeedCache.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export const config = { cache: { sMaxAge: 300 }, navMode: 'client' } as const;

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

    // Fast path for in-app navigation: the clicked post is already rendered
    // in a timeline cache — show it immediately and let the page refetch
    // thread/comments itself (stale-while-revalidate), instead of blocking
    // the swap on two sequential API roundtrips.
    const cachedPost = findPostInFeedCache(params.id!);
    if (cachedPost) {
        return {
            id: params.id!,
            source,
            sourceInURL,
            post: cachedPost,
            initialThread: undefined,
            unauthorized: false,
        };
    }

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

/**
 * Transition skeleton (instant swap): roughly the shape of the detail
 * header + post body, so the timeline never collapses while the loader is
 * in flight.
 */
export function loadingComponent() {
    return (
        <article className="min-h-screen animate-pulse">
            <header className="sticky top-0 z-40 flex items-center gap-8 border-b border-line bg-primaryBottom px-4 py-[18px]">
                <div className="size-6 rounded-full bg-line" />
                <div className="h-5 w-16 rounded bg-line" />
            </header>
            <div className="flex gap-3 border-b border-line p-4">
                <div className="size-10 shrink-0 rounded-full bg-line" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-line" />
                    <div className="h-3 w-1/4 rounded bg-line" />
                    <div className="h-3 w-full rounded bg-line" />
                    <div className="h-3 w-2/3 rounded bg-line" />
                </div>
            </div>
            <div className="flex gap-3 p-4 opacity-60">
                <div className="size-8 shrink-0 rounded-full bg-line" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/4 rounded bg-line" />
                    <div className="h-3 w-1/2 rounded bg-line" />
                </div>
            </div>
        </article>
    );
}
