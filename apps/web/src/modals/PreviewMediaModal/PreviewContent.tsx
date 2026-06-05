import { AttachmentType, type Source } from '@dimensiondev/enums';
import { memo } from 'react';

import { Image } from '@/components/Image.js';
import { VideoAsset } from '@/components/Posts/VideoAsset.js';
import { dynamic } from '@/esm/dynamic.js';
import type { Attachment } from '@/providers/types/SocialMedia.js';

const HlsPlayer = dynamic(() => import('@/components/HlsPlayer/index.js').then((m) => m.HlsPlayer), { ssr: false });

interface PreviewContentProps {
    source: Source;
    asset: Attachment;
}

export const PreviewContent = memo<PreviewContentProps>(function PreviewContent({ source, asset }) {
    if (asset.type === AttachmentType.Image) {
        return (
            <Image
                key={asset.uri}
                src={asset.uri}
                alt={asset.title ?? asset.uri}
                width={1000}
                height={1000}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[calc(100vh-110px)] w-auto object-contain max-md:h-[calc(calc(100vh-env(safe-area-inset-bottom)-env(safe-area-inset-top)-90px))] max-md:max-w-[calc(100%-30px)]"
            />
        );
    }

    if (asset.type === AttachmentType.AnimatedGif) {
        return (
            <div className="w-[85vw]" onClick={(e) => e.stopPropagation()}>
                <VideoAsset asset={asset} source={source} autoPlay />
            </div>
        );
    }

    if (asset.type === AttachmentType.Video) {
        const aspectRatio = asset.width && asset.height ? asset.width / asset.height : 16 / 9;
        return (
            <div
                className="overflow-hidden rounded-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: `min(85vw, calc((100vh - 110px) * ${aspectRatio}))`,
                    aspectRatio: `${asset.width ?? 16} / ${asset.height ?? 9}`,
                }}
            >
                <HlsPlayer
                    className="size-full"
                    src={asset.uri}
                    mode="video"
                    poster={asset.coverUri}
                    autoPlay
                    enableViewportAutoPlay={false}
                />
            </div>
        );
    }

    return null;
});
