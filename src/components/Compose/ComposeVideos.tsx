import { first } from 'lodash-es';
import { type HTMLProps, memo, useMemo } from 'react';

import { RemoveButton } from '@/components/RemoveButton.js';
import { classNames } from '@/helpers/classNames.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { MediaObject } from '@/types/compose.js';

interface ComposeVideoProps extends HTMLProps<HTMLDivElement> {
    video: MediaObject;
}
function ComposeVideo({ video, ...rest }: ComposeVideoProps) {
    const { removeVideo } = useComposeStateStore();
    const blobURL = useMemo(() => (video?.file ? URL.createObjectURL(video.file) : ''), [video?.file]);

    return (
        <div {...rest} className={classNames('relative overflow-hidden rounded-2xl', rest.className)}>
            <video className="w-full" controls src={blobURL} />

            <RemoveButton className="absolute right-1 top-1 z-10" size={18} onClick={() => removeVideo(video)} />
        </div>
    );
}

interface ComposeVideosProps extends HTMLProps<HTMLDivElement> {
    videos: MediaObject[];
}
export const ComposeVideos = memo(function ComposeVideos({ videos, ...rest }: ComposeVideosProps) {
    const size = videos.length;

    if (size === 1) {
        const target = first(videos);
        if (!target) return null;
        return <ComposeVideo video={target} {...rest} className={classNames('relative mt-3', rest.className)} />;
    }

    return (
        <div {...rest} className={classNames('grid grid-cols-2 flex-wrap gap-2', rest.className)}>
            {videos.map((video) => {
                return (
                    <div key={video.id} className="flex min-w-0 flex-grow items-center justify-center">
                        <ComposeVideo video={video} className="relative" />
                    </div>
                );
            })}
        </div>
    );
});
