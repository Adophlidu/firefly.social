import type { SocialSource } from '@dimensiondev/enums';
import { memo, useState } from 'react';

import { SwiperIndicator } from '@/components/Posts/SwiperIndicator.js';
import { VideoAsset } from '@/components/Posts/VideoAsset.js';
import type { Attachment } from '@/providers/types/SocialMedia.js';

interface VideoSwiperProps {
    videos: Attachment[];
    source: SocialSource;
    minimal?: boolean;
}

export const VideoSwiper = memo<VideoSwiperProps>(function VideoSwiper({ videos, source, minimal }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const currentVideo = videos[activeIndex];

    return (
        <div>
            <div className="aspect-video rounded-md bg-lightBg">
                {currentVideo ? (
                    <VideoAsset
                        key={`${currentVideo.uri}-${activeIndex}`}
                        asset={currentVideo}
                        minimal={minimal}
                        source={source}
                    />
                ) : null}
            </div>
            <SwiperIndicator
                className="mt-1.5"
                total={videos.length}
                activeIndex={activeIndex}
                onChange={setActiveIndex}
            />
        </div>
    );
});
