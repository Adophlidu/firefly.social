'use client';

import 'swiper/css';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import urlcat from 'urlcat';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import type { SocialSourceInURL } from '@/constants/enum.js';
import { useRouter } from '@/esm/navigation.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { PreviewContent } from '@/modals/PreviewMediaModal/PreviewContent.js';
import type { Attachment } from '@/providers/types/SocialMedia.js';

export function PreviewImageModal({
    assets,
    index,
    source,
    postId,
}: {
    assets: Attachment[];
    index: number;
    source: SocialSourceInURL;
    postId: string;
}) {
    const router = useRouter();
    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    const close = useCallback(() => {
        router.replace(urlcat('/post/:source/:id', { id: postId, source }));
    }, [router, postId, source]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            close();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [close]);

    return (
        <div className="z-modal fixed left-0 top-0 size-full">
            <div
                className="fixed inset-0 bg-black bg-opacity-90"
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    close();
                }}
            />
            <div className="size-full">
                <div className="text-main relative z-50 cursor-pointer pl-4 pt-4">
                    <CloseButton
                        onClick={close}
                        className="hover:!bg-transparent"
                        IconProps={{ className: '!text-white' }}
                    />
                </div>
                <div className="text-main flex size-full items-center">
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
                                        <PreviewContent source={resolveSocialSource(source)} asset={asset} />
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                        <ClickableButton
                            ref={prevRef}
                            className="prev-button absolute left-[50px] top-[50%] z-50 max-md:hidden"
                            aria-label="Previous image"
                        >
                            <ArrowLeftIcon width={24} height={24} className="text-main hover:bg-bg rounded-full p-1" />
                        </ClickableButton>
                        <ClickableButton
                            ref={nextRef}
                            className="next-button absolute right-[50px] top-[50%] z-50 max-md:hidden"
                            aria-label="Next image"
                        >
                            <ArrowRightIcon width={24} height={24} className="text-main hover:bg-bg rounded-full p-1" />
                        </ClickableButton>
                    </Swiper>
                </div>
            </div>
        </div>
    );
}
