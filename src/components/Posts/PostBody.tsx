'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import Lock from '@/assets/lock.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { PostBodyContent, type PostBodyContentProps } from '@/components/Posts/PostBodyContent.js';
import { classNames } from '@/helpers/classNames.js';
import { useDecryptPost } from '@/hooks/useDecryptPost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';

export const PostBody = memo(function PostBody({ ref, ...props }: PostBodyContentProps) {
    const isMedium = useIsMedium('max');

    const [{ loading, value: decryptedPost }, decryptPost] = useDecryptPost(props.post);

    const noLeftPadding = props.isDetail || isMedium || props.disablePadding;
    const post = decryptedPost || props.post;

    if (!post.isEncrypted) {
        return <PostBodyContent {...props} post={post} ref={ref} />;
    }

    return (
        <div
            className={classNames({
                '-mt-3 pl-[52px]': !noLeftPadding,
                'my-2': !props.isQuote,
            })}
            ref={ref}
        >
            <div
                className={classNames(
                    'flex items-center justify-between rounded-lg border-primaryMain px-3 py-[6px] text-medium',
                    {
                        border: !props.isQuote,
                    },
                )}
            >
                <div className="flex items-center gap-1">
                    <Lock width={16} height={16} />
                    {loading ? <Trans>Post is decrypting...</Trans> : <Trans>Post has been encrypted</Trans>}
                </div>
                {!loading && post.canDecrypt ? (
                    <ClickableButton onClick={decryptPost} className="text-highlight">
                        <Trans>Decrypt</Trans>
                    </ClickableButton>
                ) : null}
            </div>
        </div>
    );
});
