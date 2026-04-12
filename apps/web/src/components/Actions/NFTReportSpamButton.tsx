'use client';

import FlagIcon from '@dimensiondev/assets/flag.svg';
import { Trans } from '@lingui/react/macro';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import type { ClickableButtonProps } from '@/components/ClickableButton.js';
import { useReportSpamNFT } from '@/hooks/useReportSpamNFT.js';

interface Props extends Omit<ClickableButtonProps, 'children'> {
    chainId: number;
    address: string;
}

export function NFTReportSpamButton({ chainId, address, onClick, ...rest }: Props) {
    const [, reportSpamNFT] = useReportSpamNFT();
    return (
        <MenuButton
            {...rest}
            onClick={async (event) => {
                onClick?.(event);
                await reportSpamNFT(chainId, address);
            }}
        >
            <FlagIcon width={18} height={18} />
            <span className="text-main font-bold leading-[22px]">
                <Trans>Report spam</Trans>
            </span>
        </MenuButton>
    );
}
