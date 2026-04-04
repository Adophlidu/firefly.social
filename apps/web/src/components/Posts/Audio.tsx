'use client';

import 'plyr-react/plyr.css';

import Music from '@dimensiondev/assets/music.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ClickableArea } from '@/components/ClickableArea.js';
import { Image } from '@/components/Image.js';
import { Plyr } from '@/esm/Plyr.js';
import { formatImageUrl } from '@/helpers/formatImageUrl.js';
import { sanitizeDStorageUrl } from '@/helpers/sanitizeDStorageUrl.js';

interface AudioProps {
    src: string;
    poster?: string;
    title?: string;
    artist?: string;
    className?: string;
}

export const Audio = memo<AudioProps>(function Audio({ poster, src, title, artist, className }) {
    return (
        <ClickableArea className={classNames('bg-thirdMain overflow-hidden rounded-2xl p-3', className ?? '')}>
            <div className="flex space-x-2">
                {poster ? (
                    <Image
                        width={80}
                        height={80}
                        src={formatImageUrl(sanitizeDStorageUrl(poster))}
                        className="size-20 rounded-xl object-cover"
                        alt="title"
                    />
                ) : (
                    <div className="bg-secondaryMain box-content flex w-20 flex-col items-center justify-center space-y-2 rounded-xl px-[7.5px] py-4">
                        <span className="text-primaryBottom opacity-50">
                            <Music width={24} height={24} />
                        </span>
                        <span className="text-secondary break-keep text-[11px] font-medium leading-[16px]">
                            <Trans>Audio Cover</Trans>
                        </span>
                    </div>
                )}
                <div className="flex w-full flex-col space-y-1 truncate">
                    <h5 className="text-main truncate font-semibold">{title}</h5>
                    <h6 className="text-main truncate font-semibold">{artist}</h6>
                </div>
            </div>
            <div className="mt-2">
                <Plyr
                    source={{ type: 'audio', sources: [{ src }] }}
                    options={{ controls: ['current-time', 'progress', 'duration', 'play'] }}
                />
            </div>
        </ClickableArea>
    );
});
