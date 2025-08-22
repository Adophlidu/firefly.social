import { compact } from 'lodash-es';

import { readChars } from '@/helpers/chars.js';
import { PostMediaType } from '@/providers/types/Firefly.js';
import type { CompositePost } from '@/store/useComposeStore.js';

export function getPostMediaTypes(compositePost: CompositePost | undefined): PostMediaType[] {
    const chars = readChars(compositePost?.chars ?? '', 'visible');
    const types = compact([
        chars.length > 0 ? PostMediaType.Text : undefined,
        compositePost?.images.length ? PostMediaType.Image : undefined,
        compositePost?.videos.length ? PostMediaType.Video : undefined,
        compositePost?.poll ? PostMediaType.Vote : undefined,
        compositePost?.rpPayload ? PostMediaType.Redpacket : undefined,
        compositePost?.frames.length ? PostMediaType.Other : undefined,
    ]);

    return types;
}
