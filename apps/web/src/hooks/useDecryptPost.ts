import { Source } from '@dimensiondev/enums';
import { NetworkType } from '@dimensiondev/web3/enums';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';
import { useConnection } from 'wagmi';

import { ENABLED_DECRYPT_SOURCES } from '@/constants/computed.js';

import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import type { Post } from '@/providers/types/SocialMedia.js';

const resolver = memoizePromise(
    async (post: Post) => {
        const provider = resolveSocialMediaProvider(post.source);
        return provider.decryptPost(post);
    },
    (post) => `${post.metadata.content?.content}-${post.source}-${post.postId}`,
);

export function useDecryptPost(post: Post) {
    const account = useConnection();

    return useAsyncFn(async () => {
        try {
            if (!ENABLED_DECRYPT_SOURCES.includes(post.source)) return null;

            if (post.source === Source.Lens && !account.address) {
                WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
                return null;
            }

            const result = await resolver(post);
            if (result) {
                enqueueSuccessMessage(t`Post decrypted successfully!`);
            }

            return result;
        } catch (error) {
            const sourceName = resolveSourceName(post.source);
            if (error instanceof Error && error.name === 'CannotDecryptError') {
                enqueueWarningMessage(
                    t`You are not eligible to decrypt this post, try again with eligible ${sourceName} account.`,
                );
            } else {
                enqueueMessageFromError(error, t`Failed to decrypt post on ${sourceName}.`);
            }
            return null;
        }
    }, [account.address, post]);
}
