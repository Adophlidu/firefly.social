import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo, useCallback, useState } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { queryClient } from '@/configs/queryClient.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { patchPostQueryData } from '@/helpers/patchPostQueryData.js';
import { getTakoExternalHostedData } from '@/providers/firefly/farcaster-hub/getTakoExternalHostedData.js';
import { type Post } from '@/providers/types/SocialMedia.js';

interface Props extends HTMLProps<HTMLSpanElement> {
    post: Post;
}

export const ToggleMore = memo<Props>(function ToggleMore({ post, ...rest }) {
    const collapsed = !!post.incomplete && post.metadata.content?.content !== post.fullContent;
    const [loading, setLoading] = useState(false);
    const toggleQueryData = useCallback(async (post: Post, collapsed: boolean) => {
        try {
            setLoading(true);
            let content = post.fullContent;
            if (!content || !collapsed) {
                const result = await queryClient.fetchQuery({
                    queryKey: ['load-external-host-data', post.source, post.postId],
                    queryFn: async () => {
                        const ipfs = (post.__original__ as any).embeds[0].url;
                        if (!ipfs) return null;
                        const result = await getTakoExternalHostedData(ipfs);
                        return result;
                    },
                });
                content = result?.content;
            }
            if (!content) {
                enqueueErrorMessage(<Trans>Failed to show more.</Trans>);
                return;
            }
            patchPostQueryData(post.source, post.postId, (draft) => {
                draft.fullContent = content;
                if (draft.partialContent && draft.metadata.content) {
                    draft.metadata.content.content = collapsed ? content : draft.partialContent;
                }
            });
        } catch (error) {
            if (error instanceof Error) {
                enqueueErrorMessage(<Trans>Failed to show more. {error.message}</Trans>);
            } else {
                enqueueErrorMessage(<Trans>Failed to show more.</Trans>);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <span
            {...rest}
            className={classNames(rest.className, 'cursor-pointer font-bold text-highlight hover:underline')}
            onClick={async (e) => {
                e.stopPropagation();
                toggleQueryData(post, collapsed);
            }}
        >
            {loading ? <LoadingIcon className="mr-1 inline-block size-[12px]" /> : null}
            {collapsed ? <Trans>Show more</Trans> : <Trans>Show less</Trans>}
        </span>
    );
});
