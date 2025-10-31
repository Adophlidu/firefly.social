import { classNames } from '@dimensiondev/utils';
import { Select, Trans } from '@lingui/react/macro';
import { type HTMLProps, memo, useEffect, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { NakedMarkup } from '@/components/Markup/NakedMarkup.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { formatUrl } from '@/helpers/formatUrl.js';
import { isValidUrl } from '@/helpers/isValidUrl.js';
import { useDetectOverflow } from '@/hooks/useDetectOverflow.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

interface PostBodyReplyContentProps {
    post: Post;
}

const overrideComponents = {
    a: function Anchor({ title }: HTMLProps<HTMLAnchorElement>) {
        return <span>{title && isValidUrl(title) ? formatUrl(title, 30) : title}</span>;
    },
};

export const PostBodyReplyContent = memo<PostBodyReplyContentProps>(function PostBodyReplyContent({ post }) {
    const liteRawContent = post.metadata.content?.content;
    const [overflow, ref] = useDetectOverflow<HTMLDivElement>();
    const [multiple, setMultiple] = useState(1);
    const { focused } = useComposeStateStore();

    useEffect(() => {
        if (focused) {
            setMultiple(1);
        }
    }, [focused]);

    return (
        <div>
            <div
                ref={ref}
                className={classNames('single-post line-clamp-4 w-full self-stretch break-words text-base text-main', {
                    'max-h-[7.8rem]': IS_SAFARI && IS_APPLE,
                })}
                style={{ WebkitLineClamp: multiple * 4 }}
            >
                <NakedMarkup post={post} components={overrideComponents}>
                    {liteRawContent}
                </NakedMarkup>
            </div>
            <div className="flex flex-col text-base text-main">
                {overflow || multiple > 1 ? (
                    <ClickableButton
                        className="inline-flex text-highlight"
                        onClick={() => setMultiple((prev) => (overflow ? prev + 1 : 1))}
                    >
                        {overflow ? <Trans>Show more</Trans> : <Trans>Show less</Trans>}
                    </ClickableButton>
                ) : null}
                {post.metadata.content?.asset?.type ? (
                    <Select
                        value={post.metadata.content.asset.type}
                        _Image="[Image]"
                        _Video="[Video]"
                        _Audio="[Audio]"
                        _Poll="[Poll]"
                        other=""
                    />
                ) : null}
                {post.quoteOn ? (
                    <span>
                        <Trans>[Quote]</Trans>
                    </span>
                ) : null}
            </div>
        </div>
    );
});
