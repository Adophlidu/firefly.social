'use client';

import SendIcon from '@dimensiondev/assets/send.svg';
import type { SocialSource } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ActionButton } from '@/components/ActionButton.js';
import { ActionDisabledMessage } from '@/components/Actions/ActionDisabledMessage.js';
import { Avatar } from '@/components/Avatar.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { useCommentPost } from '@/hooks/useCommentPost.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface QuickReplyProps {
    source: SocialSource;
    post: Post;
}

export const QuickReply = memo<QuickReplyProps>(function QuickReply({ source, post }) {
    const currentProfile = useCurrentProfile(source);
    const { buttonDisabled, message, onComment } = useCommentPost(post, !currentProfile);

    if (!currentProfile) return null;
    // Any reply restriction (club gate, X API limit, or a legacy tooltip rule
    // such as followers-only) disables the quick-reply box in the detail page.
    if (buttonDisabled && message?.message) {
        return <ActionDisabledMessage message={message.message} />;
    }

    return (
        <ClickableArea className="flex cursor-pointer items-center border-b border-line px-4 py-3" onClick={onComment}>
            <Avatar src={currentProfile.pfp} size={40} alt={currentProfile.profileId} />
            <div className="flex-1 p-3 text-[20px] text-secondary">
                <Trans>Post your reply</Trans>
            </div>
            <ActionButton disabled className="!flex-[0] text-nowrap px-6 py-[4px]">
                <SendIcon width={18} height={18} className="mr-1 text-primaryBottom" />
                <Trans>Send</Trans>
            </ActionButton>
        </ClickableArea>
    );
});
