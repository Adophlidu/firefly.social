import { t } from '@lingui/core/macro';

import FollowUserIcon from '@/assets/follow-user.svg';
import UnFollowUserIcon from '@/assets/unfollow-user.svg';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import type { ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Source } from '@/constants/enum.js';
import { useBskyPreferences } from '@/hooks/useBskyPreferences.js';
import { useToggleJoinChannel } from '@/hooks/useToggleJoinChannel.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface Props extends Omit<ClickableButtonProps, 'children'> {
    channel: Channel;
    onClick?: () => void;
}

export function ToggleJoinChannel({ channel, ref, onClick, ...rest }: Props) {
    const { data: bskyPreferences, isLoading } = useBskyPreferences(channel.source === Source.Bsky);

    const joined =
        channel.source === Source.Bsky
            ? bskyPreferences?.savedFeeds.find((x) => x.value === channel.url)
            : !!channel.isMember;

    const Icon = joined ? UnFollowUserIcon : FollowUserIcon;
    const [isMutating, mutation] = useToggleJoinChannel(channel);

    const name = channel.source === Source.Bsky ? channel.name : channel.id;

    if (isLoading) return;

    return (
        <MenuButton
            {...rest}
            disabled={isMutating}
            onClick={async () => {
                await mutation.mutateAsync();
                onClick?.();
            }}
            ref={ref}
        >
            {isMutating ? <LoadingIcon size={18} /> : <Icon width={18} height={18} />}
            <span className="font-bold leading-[22px] text-main">{joined ? t`Leave /${name}` : t`Join /${name}`}</span>
        </MenuButton>
    );
}
