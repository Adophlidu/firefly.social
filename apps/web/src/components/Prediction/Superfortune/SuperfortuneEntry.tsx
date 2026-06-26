'use client';

import { FileMimeType, type Locale } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { memo, useCallback, useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { SuperfortuneModal } from '@/components/Prediction/Superfortune/SuperfortuneModal.js';
import { SuperfortuneSpinningIcon } from '@/components/Prediction/Superfortune/SuperfortuneSpinningIcon.js';
import { openComposeModal } from '@/controllers/openComposeModal.js';
import { downloadImage } from '@/helpers/downloadImage.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { fetchImageAsPNG } from '@/helpers/fetchImageAsPNG.js';
import {
    getSuperfortuneDetailUrl,
    getSuperfortuneGameUrl,
    getSuperfortuneShareImageDownloadUrl,
    getSuperfortuneShareImageUrl,
    resolveSuperfortuneLang,
} from '@/helpers/prediction/superfortune.js';
import { createLocalMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import { useCurrentFireflyAccountUID } from '@/hooks/useCurrentFireflyAccountUID.js';
import {
    captureBetsSuperfortuneClickEvent,
    captureBetsSuperfortuneDownloadEvent,
    captureBetsSuperfortuneJumpEvent,
    captureBetsSuperfortuneShareEvent,
} from '@/providers/telemetry/captureClickEvent.js';

interface SuperfortuneEntryProps {
    /** The match slug, used verbatim as the card `match_key` (e.g. `fifwc-ecu-ger-2026-06-25`). */
    matchKey: string;
    locale?: Locale;
}

export const SuperfortuneEntry = memo(function SuperfortuneEntry({ matchKey, locale }: SuperfortuneEntryProps) {
    const [open, setOpen] = useState(false);
    const ffid = useCurrentFireflyAccountUID() ?? '';

    const lang = resolveSuperfortuneLang(locale);
    // preview loads directly (display needs no CORS); download/post read bytes via the CORS proxy
    const shareImageUrl = useMemo(() => getSuperfortuneShareImageUrl(matchKey, lang), [matchKey, lang]);
    const downloadUrl = useMemo(() => getSuperfortuneShareImageDownloadUrl(matchKey, lang), [matchKey, lang]);

    const onEntryClick = useCallback(() => {
        captureBetsSuperfortuneClickEvent(ffid);
        setOpen(true);
    }, [ffid]);

    const onSuperfortune = useCallback(() => {
        captureBetsSuperfortuneJumpEvent(ffid);
        window.open(getSuperfortuneGameUrl(matchKey, lang), '_blank', 'noopener,noreferrer');
    }, [matchKey, ffid, lang]);

    const [{ loading: downloading }, onDownload] = useAsyncFn(async () => {
        captureBetsSuperfortuneDownloadEvent(ffid);

        try {
            await downloadImage(downloadUrl, `superfortune-${matchKey}.png`);
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to download image.`);
        }
    }, [downloadUrl, matchKey, ffid]);

    const [{ loading: posting }, onPost] = useAsyncFn(async () => {
        captureBetsSuperfortuneShareEvent(ffid);

        try {
            const blob = await fetchImageAsPNG(downloadUrl, true);
            const media = createLocalMediaObject(
                new File([blob], `superfortune-${matchKey}.png`, { type: FileMimeType.PNG }),
            );
            setOpen(false);
            openComposeModal({ type: 'compose', chars: [getSuperfortuneDetailUrl(matchKey)], images: [media] });
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to prepare the share image.`);
        }
    }, [downloadUrl, matchKey, ffid]);

    return (
        <>
            <ClickableButton className="shrink-0 cursor-pointer" aria-label={t`Sign Decoded`} onClick={onEntryClick}>
                <SuperfortuneSpinningIcon size={24} />
            </ClickableButton>
            <SuperfortuneModal
                open={open}
                imageUrl={shareImageUrl}
                downloading={downloading}
                posting={posting}
                onClose={() => setOpen(false)}
                onSuperfortune={onSuperfortune}
                onDownload={onDownload}
                onPost={onPost}
            />
        </>
    );
});
