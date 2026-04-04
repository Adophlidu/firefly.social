import { useRef, useState } from 'react';

import { FrameLayout } from '@/components/Frame/Layout.js';
import { SwiperIndicator } from '@/components/Posts/SwiperIndicator.js';
import useSwipe from '@/hooks/useSwipe.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { type Frame } from '@/types/frame.js';

interface FrameSwiperProps {
    frames: Array<{
        frame: Frame;
        url: string;
    }>;
    post: Post;
}

export function FrameSwiper({ frames, post }: FrameSwiperProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useSwipe(ref, (direction) => {
        if (direction === 'left') {
            setActiveIndex((index) => (index + 1) % frames.length);
        } else if (direction === 'right') {
            setActiveIndex((index) => (index - 1 + frames.length) % frames.length);
        }
    });

    if (!frames.length) return null;

    const currentFrame = frames[activeIndex];

    return (
        <div>
            <div ref={ref}>
                {currentFrame.frame ? (
                    <FrameLayout key={currentFrame.url} frame={currentFrame.frame} post={post} />
                ) : null}
            </div>
            <SwiperIndicator
                className="mt-1.5"
                total={frames.length}
                activeIndex={activeIndex}
                onChange={setActiveIndex}
            />
        </div>
    );
}
