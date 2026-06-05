'use client';

import 'swiper/css';

import type { SocialSourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { NotFoundError } from '@dimensiondev/utils';
import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';

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

export default function Page(props: Props) {
    const { id: postId, index, source } = use(props.params);

    const router = useRouter();
    const isMedium = useIsMedium();
    const currentSource = resolveSocialSource(source);

    const { data: post } = useSuspenseQuery({
        queryKey: [currentSource, 'post-detail', postId],
        queryFn: async () => {
            try {
                if (!postId) return;

                const provider = resolveSocialMediaProvider(currentSource);
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

    return (
        <Modal open disableDialogClose={false} enableBackdrop={false} onClose={() => router.back()}>
            <div
                className="preview-actions fixed inset-0 flex transform-none bg-black/90 bg-opacity-90 outline-none transition-all"
                onClick={isMedium ? () => router.back() : undefined}
            >
                <PreviewMediaModalContent
                    post={post}
                    source={currentSource}
                    index={Number.isNaN(+index) ? 0 : +index}
                    onClose={() => router.back()}
                />
            </div>
        </Modal>
    );
}
