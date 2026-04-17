'use client';

import { safeUnreachable } from '@dimensiondev/utils';

import { ClickableArea } from '@/components/ClickableArea.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { AdFunctionType, AdvertisementType } from '@/constants/enum.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import type { Advertisement } from '@/types/advertisement.js';

function isExternalLink(link: string, origin: string) {
    try {
        const url = new URL(link);
        return url.origin !== origin;
    } catch {
        return false;
    }
}

export function AdvertisementItem({ ad, origin = '' }: { ad: Advertisement; origin?: string }) {
    return ad.type === AdvertisementType.Link && ad.link ? (
        <Link href={ad.link} target={isExternalLink(ad.link, origin) ? '_blank' : undefined}>
            <Image className="w-full cursor-pointer rounded-xl" alt={ad.link} src={ad.image} width={346} height={130} />
        </Link>
    ) : ad.function ? (
        <ClickableArea
            onClick={() => {
                switch (ad.function) {
                    case AdFunctionType.OpenScan:
                        openLoginModal();
                        break;
                    default:
                        safeUnreachable(ad.function as never);
                        break;
                }
            }}
        >
            <Image className="w-full cursor-pointer" alt={ad.function} src={ad.image} width={346} height={130} />
        </ClickableArea>
    ) : null;
}
