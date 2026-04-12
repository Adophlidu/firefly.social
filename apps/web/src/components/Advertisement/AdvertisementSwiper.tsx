'use client';

import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { AdvertisementItem } from '@/components/Advertisement/AdvertisementItem.js';
import type { Advertisement } from '@/types/advertisement.js';

interface Props extends React.HTMLProps<'div'> {
    items: Advertisement[];
}

export function AdvertisementSwiper({ items }: Props) {
    return (
        <Swiper
            className="ff-advertisement"
            pagination={{ clickable: true }}
            loop
            modules={[Autoplay, Pagination, Navigation]}
            autoplay={{ delay: 8000 }}
            spaceBetween={50}
        >
            {items.map((ad, index) => (
                <SwiperSlide key={index} className="w-96">
                    <AdvertisementItem ad={ad} />
                </SwiperSlide>
            ))}
        </Swiper>
    );
}
