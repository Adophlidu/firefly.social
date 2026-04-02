'use client';

import MoreIcon from '@dimensiondev/assets/more.svg';
import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo } from 'react';

import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { NFTReportSpamButton } from '@/components/Actions/NFTReportSpamButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { DownloadImageButton } from '@/components/NFTDetail/DownloadImageButton.js';
import { Tooltip } from '@/components/Tooltip.js';

interface NFTDetailsMoreProps extends HTMLProps<HTMLDivElement> {
    chainId: number;
    address?: string;
    nftUrl?: string;
    nftImage?: string;
    disableReport?: boolean;
}

export const NFTDetailsMore = memo<NFTDetailsMoreProps>(function NFTDetailsMore({
    chainId,
    address,
    nftUrl = '',
    nftImage,
    disableReport,
    className,
}) {
    return (
        <MoreActionMenu
            className={className}
            button={
                <Tooltip content={<Trans>More</Trans>} placement="top">
                    <MoreIcon width={24} height={24} className="text-secondary" />
                </Tooltip>
            }
        >
            <MenuGroup>
                {address && !disableReport ? (
                    <MenuItem>
                        {({ close }) => <NFTReportSpamButton onClick={close} chainId={chainId} address={address} />}
                    </MenuItem>
                ) : null}
                {nftUrl ? <MenuItem>{({ close }) => <CopyLinkButton link={nftUrl} onClick={close} />}</MenuItem> : null}
                {nftImage ? (
                    <MenuItem>{({ close }) => <DownloadImageButton url={nftImage} onClick={close} />}</MenuItem>
                ) : null}
            </MenuGroup>
        </MoreActionMenu>
    );
});
