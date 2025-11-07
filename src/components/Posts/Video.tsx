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
import {
    Container,
    Controls,
    ErrorIndicator,
    FullscreenIndicator,
    FullscreenTrigger,
    LoadingIndicator,
    type MediaScopedProps,
    MuteTrigger,
    type PlayerProps,
    PlayingIndicator,
    PlayPauseTrigger,
    Range,
    Root,
    Seek,
    SeekBuffer,
    Thumb,
    Time,
    Track,
    useMediaContext,
    Video as LivepeerVideo,
    Volume,
    VolumeIndicator,
} from '@livepeer/react/player';
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
        <Container ref={containerRef} className="bg-black text-white" __scopeMedia={__scopeMedia}>
            <LivepeerVideo
                loop={loop}
                className="size-full rounded-md object-contain"
                poster={poster}
                muted={autoPlay || autoPlayInViewport}
            />

            <LoadingIndicator asChild>
                <div className="flex size-full items-center justify-center">
                    <LoadingIcon className="size-6 animate-spin" />
                </div>
            </LoadingIndicator>

            <ErrorIndicator matcher="all" asChild>
                <div className="flex size-full items-center justify-center">
                    <LoadingIcon className="size-6 animate-spin" />
                </div>
            </ErrorIndicator>
            {children ? (
                children
            ) : (
                <>
                    <Controls autoHide={3000} className="flex flex-col-reverse gap-1" onClick={onControlsClick}>
                        <div
                            className="space-y-1 px-1 py-2"
                            style={{
                                background:
                                    'linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%)',
                            }}
                        >
                            <div className="flex justify-between gap-5 px-3">
                                <div className="flex flex-1 items-center gap-2.5">
                                    <PlayPauseTrigger className="size-[25px]" onClick={onControlsClick}>
                                        <PlayingIndicator asChild matcher={false}>
                                            <PlayIcon />
                                        </PlayingIndicator>
                                        <PlayingIndicator asChild>
                                            <PauseIcon />
                                        </PlayingIndicator>
                                    </PlayPauseTrigger>
                                    <MuteTrigger className="size-[25px]" onClick={onControlsClick}>
                                        <VolumeIndicator asChild matcher={false}>
                                            <MuteIcon />
                                        </VolumeIndicator>
                                        <VolumeIndicator asChild matcher>
                                            <UnmuteIcon />
                                        </VolumeIndicator>
                                    </MuteTrigger>

                                    <Volume
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
                                        <Track
                                            style={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                                position: 'relative',
                                                flexGrow: 1,
                                                borderRadius: 9999,
                                                height: '2px',
                                            }}
                                        >
                                            <Range
                                                style={{
                                                    position: 'absolute',
                                                    backgroundColor: 'white',
                                                    borderRadius: 9999,
                                                    height: '100%',
                                                }}
                                            />
                                        </Track>
                                        <Thumb
                                            style={{
                                                display: 'block',
                                                width: 12,
                                                height: 12,
                                                backgroundColor: 'white',
                                                borderRadius: 9999,
                                            }}
                                        />
                                    </Volume>

                                    <Time />
                                </div>
                                <FullscreenTrigger className="size-[25px]">
                                    <FullscreenIndicator asChild matcher={false}>
                                        <EnterFullscreenIcon />
                                    </FullscreenIndicator>
                                    <FullscreenIndicator asChild>
                                        <ExitFullscreenIcon />
                                    </FullscreenIndicator>
                                </FullscreenTrigger>
                            </div>
                            <Seek className="relative flex h-5 touch-none select-none items-center">
                                <Track className="relative h-[2px] grow rounded-full bg-white bg-opacity-70">
                                    <SeekBuffer className="absolute h-full rounded-full bg-white bg-opacity-50" />
                                    <Range className="absolute h-full rounded-full bg-white" />
                                </Track>
                                <Thumb className="block size-3 rounded-full bg-white" />
                            </Seek>
                        </div>
                    </Controls>
                </>
            )}

            {hidden && playing ? (
                <span className="absolute bottom-5 left-5 z-10">{formatSecondsToHours(duration - progress)}</span>
            ) : null}
        </Container>
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
            <Root
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
            </Root>
        </ClickableArea>
    );
});
