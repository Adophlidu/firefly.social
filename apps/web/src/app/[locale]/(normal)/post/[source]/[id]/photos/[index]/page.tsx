import { EMPTY_LIST } from '@dimensiondev/constants';
import { type LayoutProps } from '@dimensiondev/types';
import { runInSafeAsync } from '@dimensiondev/utils';
import { notFound } from 'next/navigation.js';

import { PreviewImageModal } from '@/components/PreviewImageModal.js';
import { SUPPORTED_PREVIEW_MEDIA_TYPES } from '@/constants/computed.js';
import { type SocialSourceInURL } from '@/constants/enum.js';
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
        post.metadata.content?.attachments?.filter((x) => SUPPORTED_PREVIEW_MEDIA_TYPES.includes(x.type)) ?? EMPTY_LIST;

    const assets = asset?.type === 'Image' && attachments.length === 1 ? [asset] : attachments;
    return (
        <PreviewImageModal postId={postId} assets={assets} source={source} index={Number.isNaN(+index) ? 0 : +index} />
    );
}
