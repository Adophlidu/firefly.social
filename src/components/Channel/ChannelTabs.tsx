import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ChannelTabType, type SocialSource } from '@/constants/enum.js';
import { CHANNEL_TAB_TYPE } from '@/constants/index.js';
import { Link } from '@/esm/Link.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';

interface ChannelTabsProps {
    channelId: string;
    source: SocialSource;
    currentTab: ChannelTabType;
}

export const ChannelTabs = memo<ChannelTabsProps>(function ChannelTabs({ source, currentTab, channelId }) {
    const tabTypes = CHANNEL_TAB_TYPE[source];

    if (tabTypes.length <= 1) return null;

    return (
        <nav className="flex h-11 gap-1.5 px-3">
            {tabTypes.map((tab) => (
                <Link
                    className={classNames(
                        'flex h-11 items-center border-b-4 px-4 text-base font-bold',
                        currentTab === tab ? 'border-highlight text-highlight' : 'border-transparent text-third',
                    )}
                    key={tab}
                    href={resolveChannelUrl(channelId, source, tab)}
                >
                    {
                        {
                            [ChannelTabType.Posts]: <Trans>Feed</Trans>,
                            [ChannelTabType.Members]: <Trans>Members</Trans>,
                            [ChannelTabType.Followers]: <Trans>Followers</Trans>,
                        }[tab]
                    }
                </Link>
            ))}
        </nav>
    );
});
