'use client';

import DownloadIcon from '@dimensiondev/assets/download-round.svg';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps } from 'react';

import { MenuButton } from '@/components/Actions/MenuButton.js';

interface DownloadImageButtonProps extends HTMLProps<HTMLButtonElement> {
    url: string;
    onClick?: () => void;
}

export function DownloadImageButton({ url, ref, onClick }: DownloadImageButtonProps) {
    return (
        <MenuButton
            ref={ref}
            onClick={() => {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.download = url;
                a.click();
                onClick?.();
            }}
        >
            <DownloadIcon width={18} height={18} />
            <span className="text-main font-bold leading-[22px]">
                <Trans>Download media</Trans>
            </span>
        </MenuButton>
    );
}
