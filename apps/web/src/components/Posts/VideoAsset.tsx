import Play from '@dimensiondev/assets/play.svg';
import { AttachmentType, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';

import { Image } from '@/components/Image.js';
import { VideoPoster } from '@/components/Posts/VideoPoster.js';
import { dynamic } from '@/esm/dynamic.js';
import { computeSize } from '@/helpers/computeSize.js';
import { optimizeCDNImageSize } from '@/helpers/optimizeCDNImageSize.js';
import type { Attachment } from '@/providers/types/SocialMedia.js';

const HlsPlayer = dynamic(() => import('@/components/HlsPlayer/index.js').then((m) => m.HlsPlayer), { ssr: false });

interface VideoAssetProps {
    asset: Attachment;
    source: Source;
    autoPlay?: boolean;
    videoClassName?: string;
    minimal?: boolean;
}

export function VideoAsset({ asset, minimal, source, autoPlay, videoClassName }: VideoAssetProps) {
    const isGif = asset.type === AttachmentType.AnimatedGif;
    const { width, height } = asset;
    const [renderWidth] = computeSize(width || 1000, height || 1000, {
        minWidth: 50,
        minHeight: 50,
        maxWidth: 550,
        maxHeight: 450,
    });

    return minimal ? (
        <div className="relative size-full">
            <div className="absolute inset-0 m-auto box-border flex size-6 shrink-0 items-center justify-center rounded-xl bg-white/80 text-lightTextMain">
                <Play width={16} height={16} />
            </div>
            {asset.coverUri ? (
                <Image
                    width={120}
                    height={120}
                    className="size-full rounded-xl object-cover"
                    src={asset.coverUri}
                    alt={asset.coverUri}
                />
            ) : source === Source.Farcaster ? (
                <VideoPoster src={asset.uri} />
            ) : null}
        </div>
    ) : (
        <div
            className="max-w-full overflow-hidden rounded-lg"
            style={
                width && height
                    ? {
                          width: renderWidth,
                          aspectRatio: `${width}/${height}`,
                      }
                    : { width: '100%' }
            }
        >
            <HlsPlayer
                className={classNames('size-full rounded-lg object-cover', videoClassName)}
                autoPlay={autoPlay || isGif}
                enableViewportAutoPlay={!isGif}
                src={asset.uri}
                mode={isGif ? 'gif' : 'video'}
                poster={asset.coverUri ? optimizeCDNImageSize(asset.coverUri, renderWidth) : undefined}
            />
        </div>
    );
}
