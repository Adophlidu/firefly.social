import { postId as formatPostId } from '@lens-protocol/client';
import { signFrameAction } from '@lens-protocol/client/actions';
import dayjs from 'dayjs';

import { FIREFLY_LENS_V3_APP } from '@/constants/index.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import type { Additional, Provider } from '@/providers/types/Frame.js';
import type { FrameSignaturePacket } from '@/providers/types/Lens.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import type { Index } from '@/types/frame.js';

class FrameProvider implements Provider<FrameSignaturePacket> {
    async generateSignaturePacket(
        postId: string,
        frameUrl: string,
        index: Index,
        input?: string,
        additional?: Additional,
    ): Promise<FrameSignaturePacket> {
        const session = getSessionFromStorage(SessionType.Lens);
        if (!session) throw new Error('Profile not found');

        const credentials = ensureLensResultSync(lensSessionClientHolder.sessionClient.getCredentials());
        if (!credentials) throw new Error('Credentials not found');

        const result = await ensureLensResult(
            signFrameAction(lensSessionClientHolder.sessionClient, {
                transactionId: ETH_ZERO_ADDRESS,
                buttonIndex: index,
                inputText: input ?? '',
                account: safeEvmAddress(session.profileId),
                post: formatPostId(postId),
                app: safeEvmAddress(FIREFLY_LENS_V3_APP),
                specVersion: '1.1.0',
                url: frameUrl,
                state: additional?.state ?? '',
                deadline: dayjs(Date.now()).add(30, 'minute').unix(),
            }),
        );

        const packet = {
            clientProtocol: 'lens@1.0.0',
            untrustedData: {
                identityToken: credentials.idToken,
                unixTimestamp: dayjs(Date.now()).unix(),
                ...result.signedTypedData.value,
            },
            trustedData: {
                messageBytes: result.signature as string,
            },
        };

        return packet;
    }
}

export const LensFrameProvider = new FrameProvider();
