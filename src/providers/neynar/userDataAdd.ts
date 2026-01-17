import { MessageType, type UserDataType } from '@/constants/farcaster.js';
import { encodeMessageData } from '@/providers/neynar/encodeMessageData.js';
import { publishMessage } from '@/providers/neynar/publishMessage.js';

export async function userDataAdd(type: UserDataType, value: string) {
    const { messageJson } = await encodeMessageData({
        type: MessageType.USER_DATA_ADD,
        userDataBody: {
            type,
            value,
        },
    });
    await publishMessage(messageJson);
}
