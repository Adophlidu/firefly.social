export function resolveSuggestedFollowsSwiperEffect(isFirefox: boolean): 'slide' | 'coverflow' {
    return isFirefox ? 'slide' : 'coverflow';
}

export function resolveSuggestedFollowsSwiperClassName(isFirefox: boolean) {
    return isFirefox
        ? 'ff-suggested-follows-swiper ff-suggested-follows-swiper--firefox'
        : 'ff-suggested-follows-swiper';
}

export function resolveSuggestedFollowsSwiperSpaceBetween(isFirefox: boolean) {
    return isFirefox ? 12 : 0;
}

export function resolveSuggestedFollowsSwiperSlideClassName() {
    return '!h-[208px] !w-[164px]';
}
