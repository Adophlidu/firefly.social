import type { MiniAppHost } from '@farcaster/miniapp-host';

import { Source } from '@/constants/enum.js';
import { createDummyChannel } from '@/helpers/createDummyChannel.js';
import { ComposeModalRef } from '@/modals/ComposeModal/index.js';
import { FrameViewerModalRef } from '@/modals/FrameViewerModal/FrameViewerModal.js';
import { fireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';

export const frameComposeCast = async function (options) {
    const result = await ComposeModalRef.openAndWaitForClose({
        source: Source.Farcaster,
        type: 'compose',
        chars: options.text,
        embeds: options.embeds,
        channel: options.channelKey ? createDummyChannel(Source.Farcaster, options.channelKey) : undefined,
        post: options.parent ? await fireflySocialMediaProvider.getPostById(options.parent.hash) : undefined,
    });

    if (options.close) {
        FrameViewerModalRef.close();
        return;
    }

    if (!result?.post) {
        return {
            cast: null,
        };
    }

    return {
        cast: {
            hash: result.post.postId[Source.Farcaster],
        },
    };
} as MiniAppHost['composeCast'];
