import { EMPTY_LIST } from '@dimensiondev/constants';
import { AttachmentType, type SocialSourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { runInSafeAsync } from '@dimensiondev/utils';
import { notFound } from 'next/navigation.js';

import { PreviewImageModal } from '@/components/PreviewImageModal.js';
import { GALLERY_MEDIA_TYPES } from '@/helpers/getPostPreviewAttachments.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';

export const revalidate = 60;

interface Props extends LayoutProps<{ id: string; index: string; source: SocialSourceInURL }> {}

export default async function Photo(props: Props) {
    const params = await props.params;
    const { id: postId, source, index } = params;
    if (!postId) notFound();

    const currentSource = resolveSocialSource(source);
    const provider = resolveSocialMediaProvider(currentSource);

    const post = await runInSafeAsync(async () => provider.getPostById(postId));
    if (!post) notFound();

    const asset = post.metadata.content?.asset;
    const attachments =
        post.metadata.content?.attachments?.filter((x) => GALLERY_MEDIA_TYPES.includes(x.type)) ?? EMPTY_LIST;

    const assets = asset?.type === AttachmentType.Image && attachments.length === 1 ? [asset] : attachments;
    return (
        <PreviewImageModal postId={postId} assets={assets} source={source} index={Number.isNaN(+index) ? 0 : +index} />
    );
}
