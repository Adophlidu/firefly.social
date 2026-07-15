import type { DirectMessageMedia } from '@/components/DirectMessages/types.js';

const MAX_MEDIA_SIZE = 420;
const DEFAULT_MEDIA_WIDTH = 280;
const DEFAULT_MEDIA_ASPECT_RATIO = 4 / 3;

function isPositiveNumber(value: number | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function resolveDmMediaLayout(media: DirectMessageMedia) {
    const aspectRatio =
        isPositiveNumber(media.width) && isPositiveNumber(media.height)
            ? media.width / media.height
            : isPositiveNumber(media.aspectRatio)
              ? media.aspectRatio
              : DEFAULT_MEDIA_ASPECT_RATIO;
    const intrinsicWidth = isPositiveNumber(media.width)
        ? media.width
        : isPositiveNumber(media.height)
          ? media.height * aspectRatio
          : DEFAULT_MEDIA_WIDTH;

    return {
        aspectRatio,
        width: Math.min(intrinsicWidth, MAX_MEDIA_SIZE, MAX_MEDIA_SIZE * aspectRatio),
    };
}
