'use client';

import { Trans } from '@lingui/react/macro';
import { type HTMLProps } from 'react';

import DownloadIcon from '@/assets/download-round.svg';
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
            <span className="font-bold leading-[22px] text-main">
                <Trans>Download media</Trans>
            </span>
        </MenuButton>
    );
}
