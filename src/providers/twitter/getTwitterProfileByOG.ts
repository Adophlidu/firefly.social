import { Source } from '@/constants/enum.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { OpenGraphProcessor } from '@/providers/og/Processor.js';
import { convertTwitterAvatar } from '@/providers/twitter/formatTwitterProfile.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

function extractTwitterProfileByOpengraphTitle(title: string) {
    const [displayName, handle] = (title ?? '').split(' ');
    const regex = /\(@([\w_]+)\)/;
    const match = handle?.match(regex);
    if (match) {
        return {
            displayName,
            handle: match[1],
        };
    }
    return {
        displayName,
        handle,
    };
}

export async function getTwitterProfileByOG(username: string) {
    const timeout = AbortSignal.timeout(60_000);
    const ogResult = await runInSafeAsync(() =>
        OpenGraphProcessor.digestDocumentUrl(`https://x.com/${username}`, timeout),
    );
    if (!ogResult?.og) return null;
    const { displayName, handle } = extractTwitterProfileByOpengraphTitle(ogResult.og.title ?? '');
    return {
        profileId: '',
        displayName,
        handle,
        profileSource: Source.Twitter,
        source: Source.Twitter,
        fullHandle: handle,
        pfp: convertTwitterAvatar(ogResult.og.image?.url ?? ''),
        bio: ogResult.og.description ?? undefined,
        followerCount: 0,
        followingCount: 0,
        status: ProfileStatus.Active,
        verified: true,
    } satisfies Profile;
}
