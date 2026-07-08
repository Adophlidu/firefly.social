import { describe, expect, it } from 'vitest';

import {
    resolveSuggestedFollowsSwiperClassName,
    resolveSuggestedFollowsSwiperEffect,
    resolveSuggestedFollowsSwiperSlideClassName,
    resolveSuggestedFollowsSwiperSpaceBetween,
} from '@/helpers/resolveSuggestedFollowsSwiperEffect.js';

describe('resolveSuggestedFollowsSwiperEffect', () => {
    it('disables coverflow transforms in Firefox', () => {
        expect(resolveSuggestedFollowsSwiperEffect(true)).toBe('slide');
    });

    it('keeps coverflow in other browsers', () => {
        expect(resolveSuggestedFollowsSwiperEffect(false)).toBe('coverflow');
    });

    it('marks the Firefox fallback for non-3d styling', () => {
        expect(resolveSuggestedFollowsSwiperClassName(true)).toContain('ff-suggested-follows-swiper--firefox');
        expect(resolveSuggestedFollowsSwiperClassName(false)).not.toContain('ff-suggested-follows-swiper--firefox');
    });

    it('adds extra spacing between Firefox fallback items', () => {
        expect(resolveSuggestedFollowsSwiperSpaceBetween(true)).toBe(12);
        expect(resolveSuggestedFollowsSwiperSpaceBetween(true)).toBeGreaterThan(
            resolveSuggestedFollowsSwiperSpaceBetween(false),
        );
        expect(resolveSuggestedFollowsSwiperSlideClassName()).toContain('!w-[164px]');
    });
});
