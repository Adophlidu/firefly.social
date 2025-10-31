import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PostMarkup } from '@/components/Markup/PostMarkup.js';
import { useDetectOverflow } from '@/hooks/useDetectOverflow.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface Props {
    post: Post;
    postContent: string;
}

export const TruthSocialPostMarkup = memo<Props>(function TruthSocialPostMarkup({ post, postContent }) {
    const [showMore, setShowMore] = useState(true);
    const [overflow, ref] = useDetectOverflow<HTMLDivElement>();

    return (
        <>
            <div ref={ref} className={classNames({ 'line-clamp-5': showMore })}>
                <PostMarkup post={post} canShowMore={false} content={postContent} />
            </div>
            {overflow || !showMore ? (
                <div className="text-medium font-bold text-highlight">
                    <ClickableButton
                        onClick={(event) => {
                            event.stopPropagation();
                            setShowMore((prev) => !prev);
                        }}
                    >
                        {showMore ? <Trans>Show More</Trans> : <Trans>Show Less</Trans>}
                    </ClickableButton>
                </div>
            ) : null}
        </>
    );
});
