'use client';

import { Source } from '@dimensiondev/enums';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import type { SocialSource } from '@/constants/enum.js';

export function ChannelInfoBio({
    description,
    source = Source.Farcaster,
}: {
    description?: string;
    source?: SocialSource;
}) {
    return (
        <BioMarkup className="text-medium max-md:ml-[-60px]" source={source}>
            {description ?? '-'}
        </BioMarkup>
    );
}
