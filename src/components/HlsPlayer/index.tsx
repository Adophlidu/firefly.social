'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import Hls from 'hls.js';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { dispatchCustomEvent, listenCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import { logger } from '@/libs/Logger.js';

interface HlsPlayerProps {
    src: string;
    autoPlay?: boolean;
    enableViewportAutoPlay?: boolean;
    onStateChange?: (state: any) => void;
    className?: string;
    mode?: 'video' | 'gif';
    poster?: string;
}
interface QualityLevel {
    id: number;
    height: number;
    bitrate: number;
}

function formatTime(seconds: number) {
    if (isNaN(seconds)) return '00:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return [h, m, s]
        .filter((v, i) => v > 0 || i > 0)
        .map((v) => v.toString().padStart(2, '0'))
        .join(':');
}

export const HlsPlayer = memo<HlsPlayerProps>(function HlsPlayer({
    src,
    autoPlay = true,
    enableViewportAutoPlay = true,
    className = '',
    mode = 'video',
    poster,
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [levels, setLevels] = useState<QualityLevel[]>([]);
    const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 is Auto
    const [showSettings, setShowSettings] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isHls, setIsHls] = useState(false);
    const controlsTimeoutRef = useRef<number | null>(null);

    const initPlayer = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        setLoading(true);
        setError(null);
        setLevels([]);
        setProgress(0);
        setDuration(0);

        const isM3U8 = src.toLowerCase().includes('.m3u8');
        setIsHls(isM3U8);

        if (isM3U8 && Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
            });
            hlsRef.current = hls;

            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, (_event: any, data: any) => {
                setLoading(false);
                const availableLevels = data.levels.map((l: any, index: number) => ({
                    id: index,
                    height: l.height,
                    bitrate: l.bitrate,
                }));
                setLevels(availableLevels);

                if (autoPlay && !enableViewportAutoPlay) {
                    video.muted = true;
                    video.play().catch(() => setIsPlaying(false));
                }
            });

            hls.on(Hls.Events.LEVEL_SWITCHING, () => {
                setIsBuffering(true);
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (_event: any, data: any) => {
                setCurrentLevel(hls.autoLevelEnabled ? -1 : data.level);
                // We don't necessarily set isBuffering(false) here because
                // the new level fragments might still be loading/buffering
            });

            hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            setError('Network error. Retrying...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            setError('Media error. Attempting recovery...');
                            hls.recoverMediaError();
                            break;
                        default:
                            setError('Unrecoverable player error.');
                            hls.destroy();
                            break;
                    }
                }
            });

            return;
        } else {
            // Standard video (webm, mp4) or Native HLS support
            video.src = src;

            const onLoadedMetadata = () => {
                setLoading(false);
                if (autoPlay && !enableViewportAutoPlay) {
                    video.muted = true;
                    video.play().catch(() => setIsPlaying(false));
                }
            };

            const onVideoError = () => {
                setError('Failed to load video source. Format may be unsupported.');
                setLoading(false);
            };

            video.addEventListener('loadedmetadata', onLoadedMetadata);
            video.addEventListener('error', onVideoError);

            return () => {
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                video.removeEventListener('error', onVideoError);
            };
        }
    }, [src, autoPlay, enableViewportAutoPlay]);

    useEffect(() => {
        const cleanup = initPlayer();
        setHasInteracted(false);
        return () => {
            if (typeof cleanup === 'function') cleanup();
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [initPlayer]);

    useEffect(() => {
        if (!enableViewportAutoPlay || !containerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                const video = videoRef.current;
                if (!video) return;

                if (entry.isIntersecting && !hasInteracted) {
                    video.muted = true;
                    video.play().catch(() => {
                        logger.warn('Autoplay blocked by browser. Muting to try again...');
                        video.muted = true;
                        video.play().catch((e) => logger.error('Playback failed even after mute:', e));
                    });
                } else if (!entry.isIntersecting) {
                    video.pause();
                }
            },
            { threshold: 1 },
        );

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [enableViewportAutoPlay, hasInteracted]);

    useEffect(() => {
        if (mode !== 'video') return;

        return listenCustomEvent('hls-player-play', (e) => {
            if (videoRef.current && e.detail !== videoRef.current) {
                videoRef.current.pause();
            }
        });
    }, [mode]);

    const togglePlay = () => {
        setHasInteracted(true);
        if (videoRef.current?.paused) {
            videoRef.current.play();
        } else {
            videoRef.current?.pause();
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && videoRef.current.duration > 0) {
            setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
            // If time is moving, we are definitely not buffering
            if (isBuffering) setIsBuffering(false);
        }
    };

    const handleEnded = () => {
        if (mode === 'video') {
            setIsPlaying(false);
            setProgress(100);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) setDuration(videoRef.current.duration);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasInteracted(true);
        const time = (parseFloat(e.target.value) / 100) * (videoRef.current?.duration || 0);
        if (videoRef.current) videoRef.current.currentTime = time;
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasInteracted(true);
        const val = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
        }
    };

    const toggleMute = () => {
        setHasInteracted(true);
        if (videoRef.current) {
            const newMuted = !videoRef.current.muted;
            videoRef.current.muted = newMuted;
            if (!newMuted && videoRef.current.volume === 0) {
                videoRef.current.volume = 0.5;
            }
        }
    };

    const handleVolumeUpdate = () => {
        if (videoRef.current) {
            setIsMuted(videoRef.current.muted);
            const currentVolume = videoRef.current.volume;
            setVolume(isNaN(currentVolume) ? 1 : currentVolume);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const changeQuality = (id: number) => {
        if (hlsRef.current) {
            setIsBuffering(true);
            hlsRef.current.currentLevel = id;
            setCurrentLevel(id);
            setShowSettings(false);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = window.setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    const handleMouseLeave = () => {
        if (!isPlaying) return;

        if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
        setShowControls(false);
    };

    const currentTime = progress >= 99.9 ? duration : videoRef.current?.currentTime || 0;

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                e.stopPropagation();
                togglePlay();
            }}
            className={`group relative flex aspect-video cursor-pointer select-none items-center justify-center overflow-hidden rounded-2xl bg-black shadow-2xl ${className}`}
        >
            {(loading || isBuffering) && !error ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <LoadingIcon size={40} className="text-blue-500" />
                </div>
            ) : null}

            {error ? (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 p-8 text-center backdrop-blur-xl">
                    <div className="max-w-xs">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-500/20">
                            <svg className="size-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <p className="mb-2 text-lg font-semibold text-white">
                            <Trans>Streaming Error</Trans>
                        </p>
                        <p className="mb-6 text-sm text-slate-400">{error}</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setHasInteracted(false);
                                initPlayer();
                            }}
                            className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700"
                        >
                            <Trans>Retry Stream</Trans>
                        </button>
                    </div>
                </div>
            ) : null}

            <video
                ref={videoRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => {
                    setIsPlaying(true);
                    if (mode === 'video') {
                        dispatchCustomEvent('hls-player-play', videoRef.current || undefined);
                    }
                }}
                onPause={() => {
                    setIsPlaying(false);
                    setShowControls(true);
                }}
                onVolumeChange={handleVolumeUpdate}
                onEnded={handleEnded}
                onWaiting={() => setIsBuffering(true)}
                onStalled={() => setIsBuffering(true)}
                onSeeking={() => setIsBuffering(true)}
                onSeeked={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
                onPlaying={() => setIsBuffering(false)}
                className="size-full"
                playsInline
                loop={mode === 'gif'}
                muted={mode === 'gif'}
                poster={poster}
            />

            <div
                className={classNames(
                    'absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-20 transition-opacity duration-500',
                    showControls || mode === 'gif' ? 'opacity-100' : 'opacity-0',
                    mode === 'gif' ? 'px-2 pb-2' : 'px-4 pb-4',
                )}
            >
                {mode === 'video' ? (
                    <>
                        <div className="group/progress relative mb-4 px-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={isNaN(progress) ? 0 : progress}
                                onChange={handleSeek}
                                onClick={(e) => e.stopPropagation()}
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-blue-500 transition-all hover:h-2"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePlay();
                                    }}
                                    className="p-1 text-white transition-colors hover:scale-110 hover:text-blue-400 active:scale-95"
                                >
                                    {isPlaying ? (
                                        <svg className="size-8" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                        </svg>
                                    ) : (
                                        <svg className="size-8" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    )}
                                </button>

                                <div className="group/volume flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleMute();
                                        }}
                                        className="p-1 text-white transition-colors hover:text-blue-400"
                                    >
                                        {isMuted || volume === 0 ? (
                                            <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                            </svg>
                                        ) : volume < 0.5 ? (
                                            <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M7 9v6h4l5 5V4l-5 5H7zm11.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02z" />
                                            </svg>
                                        ) : (
                                            <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M3 9v6h4l5 5V4L12 9H7zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                            </svg>
                                        )}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={isMuted ? 0 : isNaN(volume) ? 1 : volume}
                                        onChange={handleVolumeChange}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-1.5 w-0 cursor-pointer appearance-none overflow-hidden rounded-full bg-white/20 accent-blue-500 transition-all group-hover/volume:w-20"
                                    />
                                </div>

                                <div className="font-mono text-xs font-medium tabular-nums tracking-wider text-white">
                                    <span>{formatTime(currentTime)}</span>
                                    <span className="mx-1 text-white/40">/</span>
                                    <span className="text-white/60">{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {isHls ? (
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowSettings(!showSettings);
                                            }}
                                            className={`p-1 text-white transition-all hover:text-blue-400 ${showSettings ? 'rotate-90 text-blue-400' : ''}`}
                                        >
                                            <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
                                            </svg>
                                        </button>

                                        {showSettings ? (
                                            <div className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-12 right-0 min-w-[160px] rounded-xl border border-white/10 bg-slate-900/95 py-2 shadow-2xl backdrop-blur-xl">
                                                <div className="mb-1 border-b border-white/5 px-4 py-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                        <Trans>Quality</Trans>
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        changeQuality(-1);
                                                    }}
                                                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${currentLevel === -1 ? 'font-bold text-blue-400' : 'text-white'}`}
                                                >
                                                    <Trans>Auto</Trans>
                                                    {currentLevel === -1 && (
                                                        <div className="size-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                                                    )}
                                                </button>
                                                {levels.map((level) => (
                                                    <button
                                                        key={level.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            changeQuality(level.id);
                                                        }}
                                                        className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${currentLevel === level.id ? 'font-bold text-blue-400' : 'text-white'}`}
                                                    >
                                                        {level.height}p
                                                        {currentLevel === level.id && (
                                                            <div className="size-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFullscreen();
                                    }}
                                    className="p-1 text-white transition-colors hover:scale-110 hover:text-blue-400"
                                >
                                    <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePlay();
                            }}
                            className="p-1 text-white transition-colors hover:scale-110 hover:text-blue-400 active:scale-95"
                        >
                            {isPlaying ? (
                                <svg className="size-8" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            ) : (
                                <svg className="size-8" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>
                        <span className="rounded border border-white/10 bg-white/20 px-1 py-0.5 text-[10px] font-bold uppercase leading-4 tracking-widest text-white">
                            <Trans>GIF</Trans>
                        </span>
                    </div>
                )}
            </div>

            {!showControls && mode === 'video' && isPlaying ? (
                <span className="absolute bottom-4 left-4 text-sm font-semibold text-white">
                    {formatTime(duration - currentTime)}
                </span>
            ) : null}
        </div>
    );
});
