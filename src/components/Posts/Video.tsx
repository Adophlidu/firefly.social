import {
    EnterFullscreenIcon,
    ExitFullscreenIcon,
    LoadingIcon,
    MuteIcon,
    PauseIcon,
    PlayIcon,
    UnmuteIcon,
} from '@livepeer/react/assets';
import { getSrc } from '@livepeer/react/external';
import * as Player from '@livepeer/react/player';
import { type MediaScopedProps, type PlayerProps, useMediaContext } from '@livepeer/react/player';
import {
    type HTMLProps,
    memo,
    type MouseEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useIntersection } from 'react-use';
import { useHover } from 'usehooks-ts';
import { useStore } from 'zustand';

import { ClickableArea } from '@/components/ClickableArea.js';
import { formatSecondsToHours } from '@/helpers/formatSeconds.js';

interface VideoProps extends HTMLProps<HTMLVideoElement> {
    forceNoToken?: boolean;
    preload?: 'metadata' | 'none' | 'auto';
    autoPlayInViewport?: boolean;
    aspectRatio?: number;
}

function VideoContent({
    loop,
    poster,
    autoPlay,
    children,
    autoPlayInViewport,
    __scopeMedia,
}: MediaScopedProps<{
    loop?: boolean;
    poster?: string;
    autoPlay?: boolean;
    children?: ReactNode;
    autoPlayInViewport?: boolean;
}>) {
    const context = useMediaContext('CustomPlayTime', __scopeMedia);
    const { hidden, playing, duration, progress, canPlay, togglePlay, setHidden } = useStore(
        context.store,
        (state) => ({
            aria: state.aria,
            hidden: state.hidden,
            playing: state.playing,
            waiting: state.waiting,
            progress: state.progress,
            duration: state.duration,
            canPlay: state.canPlay,
            togglePlay: state.__controlsFunctions.togglePlay,
            setHidden: state.__controlsFunctions.setHidden,
        }),
    );

    const [controlled, setControlled] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null!);
    const intersection = useIntersection(containerRef, {
        rootMargin: '0px',
        threshold: 0.5,
    });
    const hovered = useHover(containerRef);

    useEffect(() => {
        if (!intersection?.isIntersecting && playing) {
            togglePlay(false);
        }

        if (controlled || !autoPlayInViewport) return;
        if (intersection?.isIntersecting && !playing && canPlay) {
            togglePlay(true);
        }
    }, [controlled, playing, canPlay, autoPlayInViewport, intersection?.isIntersecting, togglePlay]);

    const onControlsClick = useCallback((event: MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setControlled(true);
    }, []);

    useEffect(() => {
        if (!hovered && playing) {
            setHidden(true);
        }
    }, [hovered, playing, setHidden]);

    return (
        <Player.Container ref={containerRef} className="bg-black text-white" __scopeMedia={__scopeMedia}>
            <Player.Video
                loop={loop}
                className="size-full rounded-md object-contain"
                poster={poster}
                muted={autoPlay || autoPlayInViewport}
            />

            <Player.LoadingIndicator asChild>
                <div className="flex size-full items-center justify-center">
                    <LoadingIcon className="size-6 animate-spin" />
                </div>
            </Player.LoadingIndicator>

            <Player.ErrorIndicator matcher="all" asChild>
                <div className="flex size-full items-center justify-center">
                    <LoadingIcon className="size-6 animate-spin" />
                </div>
            </Player.ErrorIndicator>
            {children ? (
                children
            ) : (
                <>
                    <Player.Controls autoHide={3000} className="flex flex-col-reverse gap-1" onClick={onControlsClick}>
                        <div
                            className="space-y-1 px-1 py-2"
                            style={{
                                background:
                                    'linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%)',
                            }}
                        >
                            <div className="flex justify-between gap-5 px-3">
                                <div className="flex flex-1 items-center gap-2.5">
                                    <Player.PlayPauseTrigger className="size-[25px]" onClick={onControlsClick}>
                                        <Player.PlayingIndicator asChild matcher={false}>
                                            <PlayIcon />
                                        </Player.PlayingIndicator>
                                        <Player.PlayingIndicator asChild>
                                            <PauseIcon />
                                        </Player.PlayingIndicator>
                                    </Player.PlayPauseTrigger>
                                    <Player.MuteTrigger className="size-[25px]" onClick={onControlsClick}>
                                        <Player.VolumeIndicator asChild matcher={false}>
                                            <MuteIcon />
                                        </Player.VolumeIndicator>
                                        <Player.VolumeIndicator asChild matcher>
                                            <UnmuteIcon />
                                        </Player.VolumeIndicator>
                                    </Player.MuteTrigger>

                                    <Player.Volume
                                        onClick={onControlsClick}
                                        style={{
                                            position: 'relative',
                                            display: 'flex',
                                            flexGrow: 1,
                                            height: 25,
                                            alignItems: 'center',
                                            maxWidth: 120,
                                            touchAction: 'none',
                                            userSelect: 'none',
                                        }}
                                    >
                                        <Player.Track
                                            style={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                                position: 'relative',
                                                flexGrow: 1,
                                                borderRadius: 9999,
                                                height: '2px',
                                            }}
                                        >
                                            <Player.Range
                                                style={{
                                                    position: 'absolute',
                                                    backgroundColor: 'white',
                                                    borderRadius: 9999,
                                                    height: '100%',
                                                }}
                                            />
                                        </Player.Track>
                                        <Player.Thumb
                                            style={{
                                                display: 'block',
                                                width: 12,
                                                height: 12,
                                                backgroundColor: 'white',
                                                borderRadius: 9999,
                                            }}
                                        />
                                    </Player.Volume>

                                    <Player.Time />
                                </div>
                                <Player.FullscreenTrigger className="size-[25px]">
                                    <Player.FullscreenIndicator asChild matcher={false}>
                                        <EnterFullscreenIcon />
                                    </Player.FullscreenIndicator>
                                    <Player.FullscreenIndicator asChild>
                                        <ExitFullscreenIcon />
                                    </Player.FullscreenIndicator>
                                </Player.FullscreenTrigger>
                            </div>
                            <Player.Seek className="relative flex h-5 touch-none select-none items-center">
                                <Player.Track className="relative h-[2px] grow rounded-full bg-white bg-opacity-70">
                                    <Player.SeekBuffer className="absolute h-full rounded-full bg-white bg-opacity-50" />
                                    <Player.Range className="absolute h-full rounded-full bg-white" />
                                </Player.Track>
                                <Player.Thumb className="block size-3 rounded-full bg-white" />
                            </Player.Seek>
                        </div>
                    </Player.Controls>
                </>
            )}

            {hidden && playing ? (
                <span className="absolute bottom-5 left-5 z-10">{formatSecondsToHours(duration - progress)}</span>
            ) : null}
        </Player.Container>
    );
}

export const Video = memo<VideoProps>(function Video({
    className = '',
    poster,
    src,
    autoPlay = false,
    loop = false,
    forceNoToken,
    preload = 'metadata',
    autoPlayInViewport,
    aspectRatio,
    children,
}) {
    const videoSrc = useMemo(() => {
        return getSrc(src) || ([{ src, type: 'video' }] as unknown as PlayerProps['src']);
    }, [src]);

    return (
        <ClickableArea className={className}>
            {/* Autoplay will not work in many modern browsers without setting mute to 0. */}
            <Player.Root
                preload={preload}
                src={videoSrc}
                volume={autoPlay ? 0 : 1}
                autoPlay={autoPlay}
                forceNoToken={forceNoToken}
                aspectRatio={aspectRatio}
            >
                <VideoContent loop={loop} poster={poster} autoPlay={autoPlay} autoPlayInViewport={autoPlayInViewport}>
                    {children}
                </VideoContent>
            </Player.Root>
        </ClickableArea>
    );
});
