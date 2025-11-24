import { MessageType, UserDataType } from '@/constants/farcaster.js';
import { publishMessage } from '@/providers/neynar/publishMessage.js';

export async function userDataAdd(type: UserDataType, value: string) {
    await publishMessage(() => ({
        type: MessageType.USER_DATA_ADD,
        userDataBody: {
            type,
            value,
        },
    }));
}
