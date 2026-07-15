'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useState } from 'react';

interface StickerMessageProps {
    url: string;
    fallbackUrl?: string;
    onPreview: (url: string) => void;
}

export const StickerMessage = memo(function StickerMessage({ url, fallbackUrl, onPreview }: StickerMessageProps) {
    const [currentUrl, setCurrentUrl] = useState<string | null>(url);

    if (!currentUrl) {
        return (
            <div className="rounded-[22px] border border-line bg-lightBg px-4 py-3 text-sm text-second shadow-sm">
                <Trans>Unsupported message</Trans>
            </div>
        );
    }

    return (
        <button
            type="button"
            className="flex max-h-48 max-w-48 items-center justify-center overflow-hidden rounded-2xl"
            aria-label={t`Preview sticker`}
            onClick={() => onPreview(currentUrl)}
        >
            {/* Orb stickers can use user-defined hosts that are not compatible with Next Image's allowlist. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={currentUrl}
                alt={t`Sticker`}
                className="block max-h-48 max-w-48 object-contain"
                onError={() => {
                    setCurrentUrl((value) =>
                        value === url && fallbackUrl && fallbackUrl !== url ? fallbackUrl : null,
                    );
                }}
            />
        </button>
    );
});
