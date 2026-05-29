export type HorizontalScrollDirection = 'left' | 'right';

export interface HorizontalScrollMetrics {
    scrollLeft: number;
    clientWidth: number;
    scrollWidth: number;
}

const HORIZONTAL_SCROLL_PAGE_RATIO = 0.75;

export function getNextHorizontalScrollLeft(
    metrics: HorizontalScrollMetrics,
    direction: HorizontalScrollDirection,
): number {
    const { scrollLeft, clientWidth, scrollWidth } = metrics;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const step = clientWidth * HORIZONTAL_SCROLL_PAGE_RATIO;

    if (direction === 'left') {
        return Math.max(0, scrollLeft - step);
    }

    return Math.min(maxScroll, scrollLeft + step);
}
