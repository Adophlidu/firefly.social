import { MessageType, UserDataType } from '@/constants/farcaster.js';
import { publishMessage } from '@/providers/firefly/farcaster-hub/publishMessage.js';
import { encodeMessageData } from '@/providers/neynar/encodeMessageData.js';
import { type ProfileEditable } from '@/providers/types/SocialMedia.js';

async function userDataAdd(type: UserDataType, value: string) {
    const { messageJson } = await encodeMessageData({
        type: MessageType.USER_DATA_ADD,
        userDataBody: {
            type,
            value,
        },
    });
    await publishMessage(messageJson);
}

export async function updateProfile(profile: ProfileEditable): Promise<boolean> {
    await Promise.all([
        typeof profile.displayName === 'string' ? userDataAdd(UserDataType.DISPLAY, profile.displayName) : null,
        typeof profile.bio === 'string' ? userDataAdd(UserDataType.BIO, profile.bio) : null,
        profile.pfp ? userDataAdd(UserDataType.PFP, profile.pfp) : null,
        typeof profile.website === 'string' ? userDataAdd(UserDataType.URL, profile.website) : null,
    ]);
    return true;
}
