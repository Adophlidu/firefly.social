'use client';

import 'swiper/css';
import 'swiper/css/keyboard';
import 'swiper/css/navigation';

import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';

import { Modal } from '@/components/Modal.js';
import type { SocialSourceInURL } from '@/constants/enum.js';
import { NotFoundError } from '@/constants/error.js';
import { notFound, useRouter } from '@/esm/navigation.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { PreviewMediaModalContent } from '@/modals/PreviewMediaModal/PreviewMediaModalContent.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
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
        staleTime: Infinity,
    });

    return (
        <Modal open enableBackdrop={false} onClose={() => router.back()}>
            <div
                className="preview-actions fixed inset-0 flex transform-none flex-col items-center justify-center bg-black/90 bg-opacity-90 outline-none transition-all"
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
