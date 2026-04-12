import { isSameUrl } from '@dimensiondev/utils';
import { uniq } from 'lodash-es';

import type { Post } from '@/providers/types/SocialMedia.js';

export function resolveOembedUrl(post: Pick<Post, 'metadata'>) {
    const oembedUrl = post.metadata.content?.oembedUrl;
    const oembedUrls = post.metadata.content?.oembedUrls;
    const attachmentsUrls = post.metadata.content?.attachments?.map((x) => x.uri) || [];

    if (oembedUrl && !attachmentsUrls.some((url) => isSameUrl(url, oembedUrl))) {
        return oembedUrl;
    }

    const findNonAttachmentUrl = (urls: string[]) => {
        return urls.findLast((url) => !attachmentsUrls.some((attachmentUrl) => isSameUrl(attachmentUrl, url)));
    };

    if (oembedUrls?.length) {
        const foundUrl = findNonAttachmentUrl(oembedUrls);
        if (foundUrl) return foundUrl;
    }

    return oembedUrl;
}

export function resolveAllOembedUrls(post: Pick<Post, 'metadata'>) {
    const oembedUrls = post.metadata.content?.oembedUrls;
    const attachmentsUrls = post.metadata.content?.attachments?.map((x) => x.uri);
    if (!oembedUrls?.length || !attachmentsUrls?.length) return oembedUrls || [];

    return uniq(oembedUrls.filter((url) => !attachmentsUrls.some((attachmentUrl) => isSameUrl(attachmentUrl, url))));
}
