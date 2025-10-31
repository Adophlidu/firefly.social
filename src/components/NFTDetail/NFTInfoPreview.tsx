'use client';

import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, useRef, useState } from 'react';

import PauseIcon from '@/assets/pause.svg';
import PlayIcon from '@/assets/play.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { NFTImage } from '@/components/NFTImage.js';

const iconClassName = 'size-4 text-primaryBottom';

export function NFTVideo({
    imageURL,
    video,
    ...props
}: {
    imageURL: string;
    video: string;
} & Pick<HTMLProps<'video'>, 'className' | 'autoPlay'>) {
    const [isStarted, setIsStarted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const ref = useRef<HTMLVideoElement | null>(null);
    return (
        <>
            {!isStarted || !isPlaying ? (
                <ClickableButton
                    className="absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-black/25"
                    onClick={() => {
                        ref.current?.play();
                        setIsStarted(true);
                    }}
                >
                    <PlayIcon className={iconClassName} />
                </ClickableButton>
            ) : isPlaying ? (
                <ClickableButton
                    className="absolute left-0 top-0 z-10 flex size-full cursor-pointer items-center justify-center opacity-0 duration-100 hover:opacity-100"
                    onClick={() => {
                        ref.current?.pause();
                    }}
                >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-black/25">
                        <PauseIcon className={classNames(iconClassName, 'shadow-lg')} />
                    </div>
                </ClickableButton>
            ) : null}
            <video
                playsInline
                src={video}
                poster={imageURL}
                loop
                className="size-full cursor-pointer"
                {...props}
                ref={ref}
                onClick={() => {
                    if (ref.current?.paused) {
                        ref.current?.play();
                    } else {
                        ref.current?.pause();
                    }
                    setIsStarted(true);
                }}
                onPlay={() => {
                    setIsPlaying(true);
                    setIsStarted(true);
                }}
                onPause={() => {
                    setIsPlaying(false);
                }}
            />
        </>
    );
}

export function NFTInfoPreview({ name, imageURL, video }: { imageURL: string; video?: string; name: string }) {
    return (
        <div className="relative size-full max-w-[250px] overflow-hidden rounded-[20px] border border-secondaryLine object-cover shadow-lightS3">
            {video ? (
                <NFTVideo video={video} imageURL={imageURL} autoPlay />
            ) : (
                <NFTImage
                    width={230}
                    height={230}
                    src={imageURL}
                    alt={name}
                    className="size-full object-cover"
                    fallbackClassName=""
                />
            )}
        </div>
    );
}
