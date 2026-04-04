import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getGroupWithMemberCount, getGroupWithOwner } from '@/providers/lens/getFullGroup.js';
import { getLensProfileById } from '@/providers/lens/getLensProfileById.js';
import { type Channel, type Notification } from '@/providers/types/SocialMedia.js';

export async function getLensChannelById(
    channelId: string,
    includeFollowingStatus?: boolean,
    ownerId?: string,
): Promise<Channel> {
    if (ownerId) {
        return getGroupWithOwner(channelId, ownerId);
    }
    const group = await getGroupWithMemberCount(channelId);
    const owner = group.ownerId ? await runInSafeAsync(() => getLensProfileById(group.ownerId!)) : undefined;

    return { ...group, lead: owner };
}
