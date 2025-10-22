import { memo, useMemo } from 'react';

import ColorfulLensIcon from '@/assets/lens-circle-small.svg';
import XSquareLightIcon from '@/assets/x-square-light.svg';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';

export const LoggedInSources = memo(function LoggedInSources() {
    const profilesAll = useCurrentProfilesAll();
    const availableSources = useMemo(
        () =>
            ([Source.Twitter, Source.Farcaster, Source.Lens, Source.Bsky] as const).filter((source) => {
                return !!profilesAll[source]?.profileId;
            }),
        [profilesAll],
    );

    return !availableSources.length ? null : (
        <div className="flex items-center">
            {availableSources.map((source, index, sources) => (
                <span
                    key={source}
                    style={{ zIndex: index }}
                    className={classNames(
                        'flex size-6 items-center justify-center rounded-md border border-white',
                        index > 0 && sources.length > 1 ? '-ml-1' : undefined,
                        source === Source.Lens ? 'bg-[#00B641]' : 'bg-white',
                    )}
                >
                    {source === Source.Lens ? (
                        <ColorfulLensIcon
                            className="shrink-0 text-[#00B641] [--lens-face-color:white]"
                            width={22}
                            height={22}
                        />
                    ) : source === Source.Twitter ? (
                        <XSquareLightIcon width={22} height={22} />
                    ) : (
                        <SocialSourceIcon square size={22} source={source} />
                    )}
                </span>
            ))}
        </div>
    );
});
