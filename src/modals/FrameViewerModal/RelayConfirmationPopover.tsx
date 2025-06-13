import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import QRCode from 'react-qr-code';

import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { Source } from '@/constants/enum.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { Popover } from '@/modals/FrameViewerModal/Popover.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import type { FrameV2 } from '@/types/frame.js';

export interface RelayConfirmationPopoverProps {
    schemaUrl: string;
    frame?: FrameV2;
    scannedProfile?: Profile<never>;
}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<RelayConfirmationPopoverProps>>;
};

export function RelayConfirmationPopover({ ref }: Props) {
    const profile = useCurrentProfile(Source.Farcaster);
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
                        <div className="rounded-2xl bg-white p-4">
                            <QRCode value={props.schemaUrl} size={200} />
                        </div>
                    ) : null}
                    {profile ? (
                        <div className="flex max-w-[80%] items-center justify-center gap-2">
                            <ProfileAvatar className="flex-1" size={24} profile={profile} enableSourceIcon={false} />
                            <p className="truncate text-secondary">{profile.displayName}</p>
                        </div>
                    ) : null}
                    <p className="mt-3 px-6 text-xs">
                        <Trans>
                            Scan this QR code and tap &ldquo;Approve&rdquo; on your Farcaster mobile app to start using
                            your public profile.
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
