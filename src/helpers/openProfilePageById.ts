import type { SocialSource } from '@/constants/enum.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { openWindow } from '@/helpers/openWindow.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';

const getProfileById = memoizePromise(
    async (source: SocialSource, id: string) => {
        return resolveSocialMediaProvider(source).getProfileById(id);
    },
    (source, id) => `${source}-${id}`,
);

export async function openProfilePageByProfileId(source: SocialSource, profileId: string) {
    const profile = await runInSafeAsync(() => getProfileById(source, profileId));
    if (!profile) {
        enqueueWarningMessage(`Profile not found with id = ${profileId} on ${resolveSourceName(source)}`);
        return;
    }

    openWindow(getProfileUrl(profile));
}
