import { unreachable } from '@dimensiondev/utils';

import { type SocialSource, Source, SourceInURL } from '@/constants/enum.js';
import { uploadProfileAvatar as uploadTwitterProfileAvatar } from '@/providers/twitter/uploadProfileAvatar.js';
import { uploadToS3 } from '@/services/uploadToS3.js';

export async function uploadProfileAvatar(source: SocialSource, file: File) {
    switch (source) {
        case Source.Farcaster:
        case Source.Lens:
            return uploadToS3(file, SourceInURL.Lens);
        case Source.Twitter:
            return uploadTwitterProfileAvatar(file);
        case Source.Bsky:
            return URL.createObjectURL(file);
        default:
            unreachable(source);
    }
}
