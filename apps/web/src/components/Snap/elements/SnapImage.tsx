import type { SnapImageProps } from '@dimensiondev/workers-snap';

import { Image } from '@/components/Image.js';

const ASPECT_RATIO_MAP: Record<SnapImageProps['aspect'], string> = {
    '1:1': '1 / 1',
    '16:9': '16 / 9',
    '4:3': '4 / 3',
    '9:16': '9 / 16',
};

interface Props {
    props: SnapImageProps;
}

export function SnapImage({ props: { url, aspect, alt } }: Props) {
    return (
        <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: ASPECT_RATIO_MAP[aspect] }}>
            <Image
                className="size-full object-cover"
                src={url}
                alt={alt ?? ''}
                unoptimized
                priority={false}
                fill
                sizes="100vw"
            />
        </div>
    );
}
