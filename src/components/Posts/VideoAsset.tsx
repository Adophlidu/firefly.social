import { Trans } from '@lingui/react/macro';
import { PauseIcon, PlayIcon } from '@livepeer/react/assets';
import * as Player from '@livepeer/react/player';

import Play from '@/assets/play.svg';
import { Image } from '@/components/Image.js';
import { VideoPoster } from '@/components/Posts/VideoPoster.js';
import { Source } from '@/constants/enum.js';
import { dynamic } from '@/esm/dynamic.js';
import { computeSize } from '@/helpers/computeSize.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { type Attachment } from '@/providers/types/SocialMedia.js';

const Video = dynamic(() => import('@/components/Posts/Video.js').then((module) => module.Video), { ssr: false });

interface VideoAssetProps {
    asset: Attachment;
    source: Source;
    autoPlay?: boolean;
    videoClassName?: string;
    minimal?: boolean;
}

export function VideoAsset({ asset, minimal, source, autoPlay, videoClassName }: VideoAssetProps) {
    const isGif = asset.type === 'AnimatedGif';
    const { width, height } = asset;
    const [renderWidth] = computeSize(width || 1000, height || 1000, {
        minWidth: 60,
        minHeight: 60,
        maxWidth: 550,
        maxHeight: 750,
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
            <Video
                className={videoClassName}
                loop={isGif}
                autoPlay={autoPlay || isGif}
                autoPlayInViewport={!isGif}
                src={asset.uri}
                poster={asset.coverUri}
                forceNoToken={source === Source.Twitter}
                useFetchLoader={source === Source.Twitter}
                aspectRatio={width && height ? width / height : undefined}
            >
                {isGif ? (
                    <span className="absolute bottom-[5px] left-2.5 flex items-center" onClick={stopPropagation}>
                        <Player.PlayPauseTrigger className="size-[25px]">
                            <Player.PlayingIndicator asChild matcher={false}>
                                <PlayIcon />
                            </Player.PlayingIndicator>
                            <Player.PlayingIndicator asChild>
                                <PauseIcon />
                            </Player.PlayingIndicator>
                        </Player.PlayPauseTrigger>
                        <span className="font-bold text-white">
                            <Trans>GIF</Trans>
                        </span>
                    </span>
                ) : null}
            </Video>
        </div>
    );
}
