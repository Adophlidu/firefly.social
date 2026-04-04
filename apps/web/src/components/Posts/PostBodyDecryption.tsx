'use client';

import Lock from '@dimensiondev/assets/lock.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PostBodyContent, type PostBodyContentProps } from '@/components/Posts/PostBodyContent.js';
import { useDecryptPost } from '@/hooks/useDecryptPost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';

export const PostBodyDecryption = memo(function PostBodyDecryption({ ref, ...props }: PostBodyContentProps) {
    const isMedium = useIsMedium('max');

    const [{ loading, value: decryptedPost }, decryptPost] = useDecryptPost(props.post);
    if (decryptedPost) return <PostBodyContent {...props} post={decryptedPost} ref={ref} />;

    const noLeftPadding = props.isDetail || isMedium || props.disablePadding;

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
                    'border-primaryMain text-medium flex items-center justify-between rounded-lg px-3 py-[6px]',
                    {
                        border: !props.isQuote,
                    },
                )}
            >
                <div className="flex items-center gap-1">
                    <Lock width={16} height={16} />
                    {loading ? <Trans>Post is decrypting...</Trans> : <Trans>Post has been encrypted</Trans>}
                </div>
                {!loading && props.post.canDecrypt ? (
                    <ClickableButton onClick={decryptPost} className="text-highlight">
                        <Trans>Decrypt</Trans>
                    </ClickableButton>
                ) : null}
            </div>
        </div>
    );
});
