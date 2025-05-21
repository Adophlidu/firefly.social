import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import CopyIcon from '@/assets/copy.svg';
import MoreIcon from '@/assets/more.svg';
import ReloadIcon from '@/assets/reload.svg';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { classNames } from '@/helpers/classNames.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import type { FrameV2 } from '@/types/frame.js';

interface MoreActionProps {
    className?: string;
    frame?: FrameV2;
    disabled?: boolean;
    onReload?: () => void;
}

export const MoreAction = memo(function MoreAction({ className, frame, disabled = false, onReload }: MoreActionProps) {
    const [, handleCopy] = useCopyText(frame?.x_url ?? '', { enqueueSuccessMessage: true });

    return (
        <MoreActionMenu
            loginRequired={false}
            button={<MoreIcon width={24} height={24} className={classNames('text-main', className)} />}
        >
            <MenuGroup>
                {frame?.x_url ? (
                    <MenuItem>
                        {({ close }) => (
                            <MenuButton
                                disabled={disabled}
                                onClick={() => {
                                    close();
                                    handleCopy();
                                }}
                            >
                                <CopyIcon width={18} height={18} />
                                <span className="font-bold leading-[22px] text-main">
                                    <Trans>Copy frame URL</Trans>
                                </span>
                            </MenuButton>
                        )}
                    </MenuItem>
                ) : null}
                <MenuItem>
                    {({ close }) => (
                        <MenuButton
                            disabled={disabled}
                            onClick={() => {
                                close();
                                onReload?.();
                            }}
                        >
                            <ReloadIcon width={18} height={18} />
                            <span className="font-bold leading-[22px] text-main">
                                <Trans>Reload page</Trans>
                            </span>
                        </MenuButton>
                    )}
                </MenuItem>
            </MenuGroup>
        </MoreActionMenu>
    );
});
