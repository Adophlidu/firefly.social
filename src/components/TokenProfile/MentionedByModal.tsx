import { Plural, Trans } from '@lingui/react/macro';
import { useQueries } from '@tanstack/react-query';
import { memo } from 'react';

import XFillIcon from '@/assets/x-fill.svg';
import { Avatar } from '@/components/Avatar.js';
import { CloseButton } from '@/components/IconButton.js';
import { Link } from '@/components/Link.js';
import { Modal, type ModalProps } from '@/components/Modal.js';
import { FollowButton } from '@/components/Profile/FollowButton.js';
import { Source } from '@/constants/enum.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

interface Props extends ModalProps {
    users: Profile[];
}

export const MentionedByModal = memo<Props>(function MentionedByModal({ users, ...props }) {
    const myTwitterProfile = useCurrentProfile(Source.Twitter);
    const isTwitterLogin = !!myTwitterProfile;
    const twitterProfiles = useQueries({
        queries: users.map((user) => ({
            enabled: isTwitterLogin,
            queryKey: ['profile', Source.Twitter, user.profileId, myTwitterProfile?.profileId],
            queryFn: () => twitterSocialMediaProxy.getProfileById(user.profileId),
        })),
        combine: (result) => result.map((x) => x.data),
    });

    return (
        <Modal {...props} enableBackdrop>
            <div className="z-1 box-border flex w-[420px] flex-col gap-6 rounded-xl bg-primaryBottom p-6">
                <div className="grid w-full grid-cols-[32px_auto_32px] items-center gap-2 rounded-t-[12px]">
                    <CloseButton
                        onClick={() => {
                            props.onClose();
                        }}
                    />

                    <div className="grow text-center text-lg font-bold leading-[22px] text-main">
                        <Trans>Mentioned by</Trans>
                    </div>
                </div>
                <div className="no-scrollbar flex max-h-[293px] min-h-0 grow flex-col gap-3 overflow-auto">
                    {users.map((user, i) => {
                        const count = nFormatter(user.followerCount);
                        const link = resolveProfileUrl(Source.Twitter, user.handle);
                        return (
                            <div key={user.profileId} className="flex items-center gap-2 py-0.5">
                                <Link className="flex grow items-center gap-2" href={link}>
                                    <Avatar alt={user.handle} src={user.pfp} size={40} />
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1 text-medium">
                                            <div className="font-semibold">{user.displayName}</div>
                                            <XFillIcon className="text-second" width={16} height={16} />
                                        </div>
                                        <div className="flex items-center gap-1 text-medium">
                                            <span className="text-second">@{user.handle}</span>
                                            <span className="w-[13px] text-center text-second"> · </span>
                                            <span className="text-second">
                                                <Plural
                                                    value={user.followerCount}
                                                    one={
                                                        <Trans>
                                                            <strong className="font-bold text-main">{count}</strong>{' '}
                                                            Follower
                                                        </Trans>
                                                    }
                                                    other={
                                                        <Trans>
                                                            <strong className="font-bold text-main">{count}</strong>{' '}
                                                            Followers
                                                        </Trans>
                                                    }
                                                />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                                {myTwitterProfile ? (
                                    <FollowButton
                                        className="ml-auto !min-w-8 !p-0"
                                        variant="icon"
                                        profile={twitterProfiles[i] || user}
                                    />
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
});
