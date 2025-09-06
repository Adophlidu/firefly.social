import { last } from 'lodash-es';

import { ComposeImages } from '@/components/Compose/ComposeImages.js';
import { ComposeVideos } from '@/components/Compose/ComposeVideos.js';
import { Editor } from '@/components/Compose/Editor.js';
import { Placeholder } from '@/components/Compose/Placeholder.js';
import { PollCreatorCard } from '@/components/Poll/PollCreatorCard.js';
import { ImageAsset } from '@/components/Posts/ImageAsset.js';
import { PostLinksInCompose } from '@/components/Posts/PostLinks.js';
import { Quote } from '@/components/Posts/Quote.js';
import { Reply } from '@/components/Posts/Reply.js';
import { RemoveButton } from '@/components/RemoveButton.js';
import type { SocialSource } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { resolveEmbedMediaType } from '@/helpers/resolveEmbedMediaType.js';
import { sanitizeDStorageUrl } from '@/helpers/sanitizeDStorageUrl.js';
import { EmbedMediaType } from '@/providers/types/Firefly.js';
import { type CompositePost, useComposeStateStore } from '@/store/useComposeStore.js';

interface ComposeContentProps {
    post: CompositePost;
}

export function ComposeContent(props: ComposeContentProps) {
    const { type, cursor, removeUrl } = useComposeStateStore();

    const { id, parentPost, images, videos, urls, poll, availableSources, chars } = props.post;

    // in reply and quote mode, there could be only one parent post
    const [, post] =
        Object.entries(parentPost).find(
            ([source, value]) => value && SORTED_SOCIAL_SOURCES.includes(source as SocialSource),
        ) ?? [];
    const replying = type === 'reply' && !!post;

    const imagesInUrl = urls.filter((url) => resolveEmbedMediaType(url, EmbedMediaType.IMAGE) === 'Image');
    const lastImageInUrl = last(imagesInUrl);

    return (
        <div className="relative flex flex-1 flex-col">
            {replying ? <Reply post={post} compositePost={props.post} /> : null}

            {!replying ? (
                cursor === id ? (
                    <Editor post={props.post} replying={replying} />
                ) : (
                    <Placeholder post={props.post} />
                )
            ) : null}

            {/* poll */}
            {poll ? <PollCreatorCard post={props.post} readonly={cursor !== props.post.id} /> : null}

            {/* image */}
            {images.length > 0 ? <ComposeImages className="mt-2 flex-grow" images={images} /> : null}

            {/* video */}
            {videos.length > 0 ? <ComposeVideos className="mt-2 flex-grow" videos={videos} /> : null}

            {/* quote */}
            {type === 'quote' && post ? <Quote post={post} className="text-left" /> : null}

            {lastImageInUrl ? (
                <div className="relative mt-2 flex-grow">
                    <ImageAsset
                        className={'w-full cursor-pointer rounded-lg object-cover'}
                        width={1000}
                        height={1000}
                        src={sanitizeDStorageUrl(lastImageInUrl)}
                        alt={lastImageInUrl}
                        overSize
                    />
                    <RemoveButton className="absolute right-1 top-1 z-10" onClick={() => removeUrl(lastImageInUrl)} />
                </div>
            ) : null}

            <PostLinksInCompose
                urls={urls.filter((url) => !imagesInUrl.includes(url))}
                chars={chars}
                parentPost={post}
                source={post?.source ?? availableSources[0]}
                type={type}
            />
        </div>
    );
}
