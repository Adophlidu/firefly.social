'use client';

import 'swiper/css';

import type { SocialSource, SocialSourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { NotFoundError } from '@dimensiondev/utils';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, use, useCallback } from 'react';
import urlcat from 'urlcat';

import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { STALE_TIMES } from '@/constants/query.js';
import { notFound, useRouter } from '@/esm/navigation.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { PreviewMediaModalContent } from '@/modals/PreviewMediaModal/PreviewMediaModalContent.js';

interface Props extends LayoutProps<{
    id: string;
    index: string;
    source: SocialSourceInURL;
}> {}

interface PhotoContentProps {
    postId: string;
    source: SocialSource;
    index: number;
    onClose: () => void;
}

function PhotoContent({ postId, source, index, onClose }: PhotoContentProps) {
    const { data: post } = useSuspenseQuery({
        queryKey: [source, 'post-detail', postId],
        // Fetch on the client so source-specific media paths that require a session (e.g. X) resolve.
        queryFn: async () => {
            try {
                if (!postId) return;

                const provider = resolveSocialMediaProvider(source);
                const post = await provider.getPostById(postId);
                if (!post) notFound();

                return post;
            } catch (error) {
                if (error instanceof NotFoundError) notFound();
                throw error;
            }
        },
        // The image data of the post will not be changed.
        staleTime: STALE_TIMES.INFINITY,
    });

    return <PreviewMediaModalContent post={post} source={source} index={index} onClose={onClose} />;
}

export default function Page(props: Props) {
    const { id: postId, index, source } = use(props.params);

    const router = useRouter();
    const isMedium = useIsMedium();
    const currentSource = resolveSocialSource(source);

    // Direct-URL loads have no history to go back to, so closing lands on the post detail page.
    const close = useCallback(() => {
        router.replace(urlcat('/post/:source/:id', { id: postId, source }));
    }, [router, postId, source]);

    return (
        <Modal open disableDialogClose={false} enableBackdrop={false} onClose={close}>
            <div
                className="preview-actions fixed inset-0 flex transform-none bg-black/90 bg-opacity-90 outline-none transition-all"
                onClick={isMedium ? close : undefined}
            >
                <Suspense fallback={<Loading className="flex-1 !text-white" />}>
                    <PhotoContent
                        postId={postId}
                        source={currentSource}
                        index={Number.isNaN(+index) ? 0 : +index}
                        onClose={close}
                    />
                </Suspense>
            </div>
        </Modal>
    );
}
