'use client';

import { type HTMLProps, useEffect, useRef, useState } from 'react';

import MiniLogo from '@/assets/miniLogo.svg';
import { classNames } from '@/helpers/classNames.js';

interface FireflyLoadingIndicatorProps extends HTMLProps<HTMLVideoElement> {
    size?: number;
}

export function FireflyLoadingIndicator({ size = 208, className, ...rest }: FireflyLoadingIndicatorProps) {
    const [loaded, setLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const videoElement = videoRef.current;

        function handleCanPlay() {
            setLoaded(true);
        }
        videoElement?.addEventListener('canplay', handleCanPlay);
        return () => {
            videoElement?.removeEventListener('canplay', handleCanPlay);
        };
    }, []);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {!loaded ? (
                <MiniLogo
                    width={(85 / 208) * size}
                    height="auto"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                />
            ) : null}
            <video
                ref={videoRef}
                src="/webm/global-loading.webm"
                autoPlay
                muted
                loop
                playsInline
                webkit-playsinline="true"
                width={size}
                height={size}
                disablePictureInPicture
                disableRemotePlayback
                style={{ width: size, height: size }}
                onLoad={() => setLoaded(true)}
                className={classNames(!loaded ? 'opacity-0' : '', className)}
                {...rest}
            />
        </div>
    );
}
