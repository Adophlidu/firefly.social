import { type SocialSource, Source, SourceInURL } from '@/constants/enum.js';
import { TwitterSocialMediaProvider } from '@/providers/twitter/SocialMedia.js';
import { uploadToS3 } from '@/services/uploadToS3.js';

export async function uploadProfileAvatar(source: SocialSource, file: File) {
    switch (source) {
        case Source.Twitter:
            return TwitterSocialMediaProvider.uploadProfileAvatar(file);
        case Source.Bsky:
            return URL.createObjectURL(file);
        default:
            return uploadToS3(file, SourceInURL.Lens);
    }
}
