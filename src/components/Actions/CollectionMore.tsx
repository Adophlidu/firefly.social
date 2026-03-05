import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo } from 'react';

import MoreIcon from '@/assets/more-circle.svg';
import ShareIcon from '@/assets/share.svg';
import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { NFTReportSpamButton } from '@/components/Actions/NFTReportSpamButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { openWindow } from '@/helpers/openWindow.js';
import { resolveNFTUrlByCollection } from '@/helpers/resolveNFTUrl.js';
import { ConfirmLeavingModalRef } from '@/modals/ConfirmLeavingModal/refs.js';

interface CollectionMoreProps extends HTMLProps<HTMLDivElement> {
    chainId: number;
    address?: string;
    externalUrl?: string;
}

export const CollectionMore = memo<CollectionMoreProps>(function CollectionMore({
    chainId,
    address,
    externalUrl,
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
                {address ? (
                    <>
                        <MenuItem>
                            {({ close }) => <NFTReportSpamButton onClick={close} chainId={chainId} address={address} />}
                        </MenuItem>
                        <MenuItem>
                            {({ close }) => (
                                <CopyLinkButton link={resolveNFTUrlByCollection(address)} onClick={close} />
                            )}
                        </MenuItem>
                    </>
                ) : null}
                {externalUrl ? (
                    <MenuItem>
                        <MenuButton
                            onClick={async () => {
                                if (await ConfirmLeavingModalRef.openAndWaitForClose(externalUrl)) {
                                    openWindow(externalUrl, '_blank');
                                }
                            }}
                        >
                            <ShareIcon width={18} height={18} />
                            <span className="font-bold leading-[22px]">
                                <Trans>View on website</Trans>
                            </span>
                        </MenuButton>
                    </MenuItem>
                ) : null}
            </MenuGroup>
        </MoreActionMenu>
    );
});
