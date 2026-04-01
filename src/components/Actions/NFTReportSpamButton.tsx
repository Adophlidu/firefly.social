'use client';

import { Trans } from '@lingui/react/macro';

import FlagIcon from '@/assets/flag.svg';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { type ClickableButtonProps } from '@/components/ClickableButton.js';
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
            <span className="font-bold leading-[22px] text-main">
                <Trans>Report spam</Trans>
            </span>
        </MenuButton>
    );
}
