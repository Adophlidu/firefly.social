'use client';

import UserIcon from '@dimensiondev/assets/user.svg';
import { Source } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';

import { Avatar } from '@/components/Avatar.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Modal } from '@/components/Modal.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { PostRestrictionModalRefType } from '@/modals/PostRestrictionModal/refs.js';
import { joinOrRequestLensChannel } from '@/providers/lens/requestLensChannelMembership.js';
import {
    canRequestLensClubMembership,
    resolveChannelMembershipStatus,
} from '@/providers/lens/resolveChannelMembershipStatus.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface Props {
    ref: React.Ref<PostRestrictionModalRefType>;
}

export function PostRestrictionModal({ ref }: Props) {
    const [channel, setChannel] = useState<Channel>();
    const profile = useCurrentProfile(Source.Lens);
    const [open, dispatch] = useSingletonModal(ref, {
        name: 'post-restriction-modal',
        onOpen: ({ channel }) => setChannel(channel),
        onClose: () => setChannel(undefined),
    });

    const [{ loading }, join] = useAsyncFn(async () => {
        if (!channel) return;
        if (!profile?.profileId) {
            openLoginModalWithGuard({ source: Source.Lens });
            return;
        }

        try {
            const outcome = await joinOrRequestLensChannel(channel, profile.profileId);
            dispatch?.close(outcome);
        } catch (error) {
            enqueueErrorMessage(t`Failed to join the club.`, { error });
        }
    }, [channel, dispatch, profile?.profileId]);

    if (!channel) return null;
    const membershipStatus = resolveChannelMembershipStatus(channel);
    const canJoin = canRequestLensClubMembership(channel);

    return (
        <Modal
            open={open}
            size="xs"
            title={<Trans>Post Restriction</Trans>}
            enableClose
            onClose={() => dispatch?.close(undefined)}
            panelClassName="px-4 pb-4 pt-0"
        >
            <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center gap-3 rounded-xl border border-secondaryLine p-3">
                    <Avatar src={channel.imageUrl} alt={channel.name} size={48} className="shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="truncate text-base font-bold text-main">{channel.name}</span>
                            <SocialSourceIcon source={Source.Lens} size={18} className="shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 text-medium text-secondary">
                            {channel.lead?.handle ? <span className="truncate">By @{channel.lead.handle}</span> : null}
                            <span className="flex shrink-0 items-center gap-1 text-main">
                                <UserIcon width={16} height={16} />
                                {nFormatter(channel.followerCount)}
                            </span>
                        </div>
                    </div>
                </div>
                <p className="text-medium text-main">
                    <Trans>To post in this club you must be a member.</Trans>
                </p>
                {canJoin || membershipStatus === 'pendingRequest' ? (
                    <ClickableButton
                        className="h-10 w-full rounded-lg bg-main text-medium font-bold text-primaryBottom"
                        disabled={membershipStatus === 'pendingRequest'}
                        loading={loading}
                        onClick={join}
                    >
                        {membershipStatus === 'pendingRequest' ? <Trans>Pending</Trans> : <Trans>Join</Trans>}
                    </ClickableButton>
                ) : null}
            </div>
        </Modal>
    );
}
