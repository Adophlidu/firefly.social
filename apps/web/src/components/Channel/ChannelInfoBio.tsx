'use client';

import { classNames } from '@dimensiondev/utils';

import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { type SocialSource } from '@/constants/enum.js';

export function ChannelInfoBio({ description, source }: { description?: string; source: SocialSource }) {
    return (
        <BioMarkup className={classNames('text-medium max-md:-ml-[60px]')} source={source}>
            {description ?? '-'}
        </BioMarkup>
    );
}
