'use client';

import type { SignInOptions } from '@farcaster/miniapp-host';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { Popover } from '@/modals/FrameViewerModal/Popover.js';
import { RelayConfirmationRouter } from '@/modals/FrameViewerModal/RelayConfirmationRouter.js';
import type { FrameV2 } from '@/types/frame.js';

export interface RelayConfirmationPopoverOpenProps {
    fid: number;
    frame: FrameV2;
    options: SignInOptions;
}

export type RelayConfirmationPopoverCloseProps = {
    message: string;
    signature: string;
    authMethod: 'custody' | 'authAddress';
} | null;

interface Props {
    ref: React.Ref<SingletonModalRefCreator<RelayConfirmationPopoverOpenProps, RelayConfirmationPopoverCloseProps>>;
}

export function RelayConfirmationPopover({ ref }: Props) {
    const [props, setProps] = useState<RelayConfirmationPopoverOpenProps>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(props) {
            setProps(props);
        },
    });

    const handleClose = (result: RelayConfirmationPopoverCloseProps) => {
        dispatch?.close(result);
    };

    if (!props) return null;

    return (
        <Popover
            title={<Trans>Sign in with Farcaster</Trans>}
            content={
                <RelayConfirmationRouter
                    fid={props.fid}
                    frame={props.frame}
                    options={props.options}
                    onClose={handleClose}
                />
            }
            frame={props?.frame}
            open={open}
            onClose={() => dispatch?.close(null)}
        />
    );
}

export const RelayConfirmationPopoverRef = new SingletonModal<
    RelayConfirmationPopoverOpenProps,
    RelayConfirmationPopoverCloseProps
>();
