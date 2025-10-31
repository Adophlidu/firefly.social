import { safeUnreachable } from '@firefly/utils';
import { type ReactNode, Suspense } from 'react';

import { MutedWallets } from '@/app/(settings)/components/MutedWallets.js';
import ComebackIcon from '@/assets/comeback.svg';
import { MutedChannels } from '@/components/Channel/MutedChannels.js';
import { Loading } from '@/components/Loading.js';
import { MutedProfiles } from '@/components/Profile/MutedProfiles.js';
import { MuteType, PageRoute, Source } from '@/constants/enum.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { useComeBack } from '@/hooks/useComeback.js';

interface MutedListProps {
    name: ReactNode;
    type: MuteType;
    source: Source;
}

function MutedContent({ type, source }: { type: MuteType; source: Source }) {
    const socialSource = narrowToSocialSource(source);

    switch (type) {
        case MuteType.Channel:
            return <MutedChannels source={socialSource} />;
        case MuteType.Profile:
            return <MutedProfiles source={socialSource} />;
        case MuteType.Wallet:
            return <MutedWallets />;
        default:
            safeUnreachable(type);
            return null;
    }
}

export function MutedListPage({ name, type, source }: MutedListProps) {
    const comeback = useComeBack(PageRoute.SettingsMutes);

    return (
        <div className="flex h-screen flex-1 flex-col p-6">
            <div className="sticky top-0 z-10 flex items-center gap-6 bg-primaryBottom pb-6 text-[20px] font-bold leading-6 text-lightMain">
                <ComebackIcon className="cursor-pointer" width={24} height={24} onClick={comeback} />
                {name}
            </div>
            <div className="no-scrollbar flex-1 overflow-auto">
                <Suspense fallback={<Loading />}>
                    <MutedContent type={type} source={source} />
                </Suspense>
            </div>
        </div>
    );
}
