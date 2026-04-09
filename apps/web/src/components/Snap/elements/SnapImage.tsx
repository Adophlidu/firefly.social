import { Image } from '@/components/Image.js';
import { type SnapImageProps } from '@/types/snap.js';

const ASPECT_RATIO_MAP: Record<SnapImageProps['aspectRatio'], string> = {
    '1:1': '1 / 1',
    '16:9': '16 / 9',
    '4:3': '4 / 3',
    '9:16': '9 / 16',
};

interface Props {
    props: SnapImageProps;
}

export function SnapImage({ props: { src, aspectRatio } }: Props) {
    return (
        <div className="w-full overflow-hidden rounded-lg" style={{ aspectRatio: ASPECT_RATIO_MAP[aspectRatio] }}>
            <Image
                className="h-full w-full object-cover"
                src={src}
                alt=""
                unoptimized
                priority={false}
                fill
                sizes="100vw"
            />
        </div>
    );
}
