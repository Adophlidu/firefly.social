'use client';

import 'swiper/css';
import 'swiper/css/keyboard';
import 'swiper/css/navigation';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useMemo, useRef } from 'react';
import { Keyboard, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import type { Source } from '@/constants/enum.js';
import { EMPTY_LIST, SUPPORTED_PREVIEW_MEDIA_TYPES } from '@/constants/index.js';
import { PreviewContent } from '@/modals/PreviewMediaModal/PreviewContent.js';
import type { Attachment, Post } from '@/providers/types/SocialMedia.js';

export interface PreviewMediaModalContentProps {
    index: number;
    source: Source;
    post?: Post;
    medias?: Attachment[];
    onClose: () => void;
}

export function PreviewMediaModalContent({ onClose, post, source, medias, index }: PreviewMediaModalContentProps) {
    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    const assets = useMemo(() => {
        if (medias) return medias;
        if (!post) return EMPTY_LIST;
        const asset = post.metadata.content?.asset;
        const attachments =
            post.metadata.content?.attachments?.filter((x) => SUPPORTED_PREVIEW_MEDIA_TYPES.includes(x.type)) ??
            EMPTY_LIST;

        if (asset?.type === 'Image' && attachments.length === 1) {
            return [asset];
        }
        return attachments;
    }, [post, medias]);

    return (
        <>
            <div className="absolute left-4 top-4 z-50 cursor-pointer text-main">
                <CloseButton
                    onClick={onClose}
                    className="hover:!bg-transparent"
                    IconProps={{ className: '!text-white' }}
                />
            </div>
            <div className="flex w-full text-main">
                <Swiper
                    modules={[Navigation, Keyboard]}
                    navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current,
                    }}
                    onBeforeInit={(swiper) => {
                        if (typeof swiper.params.navigation === 'object') {
                            swiper.params.navigation.prevEl = prevRef.current;
                            swiper.params.navigation.nextEl = nextRef.current;
                        }
                    }}
                    keyboard
                    initialSlide={index}
                >
                    {assets.map((asset, key) => {
                        return (
                            <SwiperSlide key={key} className="flex">
                                <div className="flex size-full items-center justify-center">
                                    <PreviewContent source={source} asset={asset} />
                                </div>
                            </SwiperSlide>
                        );
                    })}
                    <ClickableButton
                        ref={prevRef}
                        className="prev-button absolute left-[50px] top-1/2 z-50 max-md:hidden"
                        aria-label="Previous media"
                    >
                        <ArrowLeftIcon width={24} height={24} className="rounded-full p-1 text-main hover:bg-bg" />
                    </ClickableButton>
                    <ClickableButton
                        ref={nextRef}
                        className="next-button absolute right-[50px] top-1/2 z-50 max-md:hidden"
                        aria-label="Next media"
                    >
                        <ArrowRightIcon width={24} height={24} className="rounded-full p-1 text-main hover:bg-bg" />
                    </ClickableButton>
                </Swiper>
            </div>
        </>
    );
}
