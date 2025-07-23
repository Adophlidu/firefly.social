import { type SocialSource, Source } from '@/constants/enum.js';
import { isLensV2PostId } from '@/helpers/isLensV2PostId.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

export async function getPostById(source: SocialSource, postId: string) {
    const provider = resolveSocialMediaProvider(source, { [Source.Twitter]: 'twitter' });
    return runInSafeAsync(() => {
        if (source === Source.Lens && isLensV2PostId(postId)) {
            return LensSocialMediaProvider.getPostById(postId, true);
        }
        return provider.getPostById(postId);
    });
}
