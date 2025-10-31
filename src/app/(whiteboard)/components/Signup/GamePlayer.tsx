import { classNames } from '@dimensiondev/utils';
import { throttle } from 'lodash-es';
import { memo, useEffect, useRef, useState } from 'react';

import { toggleSignupAudio } from '@/app/(whiteboard)/signup/pages/audio.js';
import FireflyCard from '@/assets/firefly-card.svg';
import { Image } from '@/esm/Image.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';

interface GamePlayerProps {
    avatar?: string;
    nickname?: string;
}

const maxTilt = 10;

export const GamePlayer = memo<GamePlayerProps>(function GamePlayer({ avatar, nickname }) {
    const boxRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('');
    const isMedium = useIsMedium();

    useEffect(() => {
        const boxElement = boxRef.current;
        if (!boxElement || !isMedium) return;

        const onMouseMove = throttle((event: MouseEvent) => {
            const containerRect = boxElement.getBoundingClientRect();
            const centerX = containerRect.left + containerRect.width / 2;
            const centerY = containerRect.top + containerRect.height / 2;

            const mouseX = event.clientX - centerX;
            const mouseY = event.clientY - centerY;

            const tiltY = (mouseX / centerX) * maxTilt;
            const tiltX = -(mouseY / centerY) * maxTilt;
            const transform = `perspective(500px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            setTransform(transform);
        }, 50);

        document.addEventListener('mousemove', onMouseMove);
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
        };
    }, [isMedium]);

    return (
        <div className="relative w-fit" ref={boxRef} style={{ transform: isMedium ? transform : 'none' }}>
            <FireflyCard className="h-auto w-[60vw] max-w-[385px] cursor-pointer" onClick={toggleSignupAudio} />
            {avatar ? (
                <div className="absolute left-[29.08%] top-[16.15%] aspect-square w-[35.41%]">
                    <Image
                        src={decodeURIComponent(avatar)}
                        alt="Avatar"
                        width={136}
                        height={136}
                        className="size-full rounded-sm object-cover"
                    />
                </div>
            ) : null}
            <div
                className={classNames(
                    'absolute inset-x-0 top-[54.2%] -translate-x-2 truncate px-6 text-center text-[29px] font-bold tracking-[0.07em] text-black md:text-[38px]',
                    bedStead.className,
                )}
            >
                {nickname || 'Firefly'}
            </div>
        </div>
    );
});
