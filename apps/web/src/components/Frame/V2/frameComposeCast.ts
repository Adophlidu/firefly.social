import { Source } from '@dimensiondev/enums';
import type { MiniAppHost } from '@farcaster/miniapp-host';

import { openAndWaitForCloseComposeModal } from '@/controllers/openComposeModal.js';
import { closeFrameViewerModal } from '@/controllers/openFrameViewerModal.js';
import { createDummyChannel } from '@/helpers/createDummyChannel.js';
import { getPostById } from '@/providers/firefly/farcaster-hub/getPostById.js';

export const frameComposeCast = async function (options) {
    const result = await openAndWaitForCloseComposeModal({
        source: Source.Farcaster,
        type: 'compose',
        chars: options.text,
        embeds: options.embeds,
        channel: options.channelKey ? createDummyChannel(Source.Farcaster, options.channelKey) : undefined,
        post: options.parent ? await getPostById(options.parent.hash) : undefined,
    });

    if (options.close) {
        closeFrameViewerModal();
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
