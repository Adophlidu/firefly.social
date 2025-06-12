import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import QRCode from 'react-qr-code';

import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { Popover } from '@/modals/FrameViewerModal/Popover.js';
import type { FrameV2 } from '@/types/frame.js';

export interface RelayConfirmationPopoverProps {
    schemaUrl: string;
    frame?: FrameV2;
}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<RelayConfirmationPopoverProps>>;
};

export function RelayConfirmationPopover({ ref }: Props) {
    const [props, setProps] = useState<RelayConfirmationPopoverProps>();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(props) {
            setProps(props);

            const u = parseUrl(props.schemaUrl);
            if (IS_MOBILE_DEVICE && u?.hostname === 'farcaster.xyz') {
                location.href = props.schemaUrl;
            }
        },
    });

    return (
        <Popover
            title={<Trans>Confirm to sign in</Trans>}
            content={
                <div className="relative flex flex-col items-center justify-center gap-2 py-2">
                    {props?.schemaUrl ? (
                        <div className="mb-2 rounded-2xl bg-white p-4">
                            <QRCode value={props.schemaUrl} size={200} />
                        </div>
                    ) : null}
                    <p className="px-6 text-xs">
                        <Trans>
                            Scan this QR code and tap &ldquo;Approve&rdquo; on your Farcaster mobile app to start using
                            your wallet on web.
                        </Trans>
                    </p>
                </div>
            }
            frame={props?.frame}
            open={open}
            onClose={() => dispatch?.close()}
        />
    );
}
