'use client';

import type { PredictionPlatform } from '@dimensiondev/enums';
import { memo } from 'react';

import { ShareAction } from '@/components/Actions/ShareAction.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';

interface PredictionEventShareButtonProps {
    platform: PredictionPlatform;
    eventId: string;
    isMulti: boolean;
}

/** FW-7911 — the share icon in the Market/Event detail page header, alongside timeline-cell sharing. */
export const PredictionEventShareButton = memo(function PredictionEventShareButton({
    platform,
    eventId,
    isMulti,
}: PredictionEventShareButtonProps) {
    const baseUrl = RouteResolver.betsEventDetail(platform, eventId, { multiple: isMulti, appendRoot: true });
    const longUrl = useShareUrl(baseUrl);
    const { register } = useShortShareUrl(longUrl);

    return <ShareAction cellType="Prediction" link={longUrl} register={register} />;
});
