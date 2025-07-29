import type { SignInOptions } from '@farcaster/miniapp-host';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import urlcat from 'urlcat';

import { ClickableArea } from '@/components/ClickableArea.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';
import { Source } from '@/constants/enum.js';
import { FARCASTER_REPLY_URL, SITE_URL } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getCurrentProfile } from '@/helpers/getCurrentProfile.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { Popover } from '@/modals/FrameViewerModal/Popover.js';
import { captureFrameSignInEvent } from '@/providers/telemetry/captureFrameSignInEvent.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { pollingChannelToken } from '@/providers/warpcast/pollingChannelToken.js';
import type { FrameV2 } from '@/types/frame.js';

export interface RelayConfirmationPopoverOpenProps {
    frame: FrameV2;
    options: SignInOptions;
}

export type RelayConfirmationPopoverCloseProps = {
    message: string;
    signature: string;
    authMethod: 'custody' | 'authAddress';
} | null;

type Props = {
    ref: React.Ref<SingletonModalRefCreator<RelayConfirmationPopoverOpenProps, RelayConfirmationPopoverCloseProps>>;
};

export function RelayConfirmationPopover({ ref }: Props) {
    const profile = useCurrentProfile(Source.Farcaster);

    const controller = useAbortController();

    const [scannedProfile, setScannedProfile] = useState<Profile | null>(null);
    const [props, setProps] = useState<RelayConfirmationPopoverOpenProps>();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(props) {
            setProps(props);
        },
    });
    const { isLoading, isRefetching, isError, data, refetch } = useQuery({
        queryKey: ['farcaster-relay-channel', props?.frame, props?.options],
        queryFn: async () => {
            if (!props) return;

            // Abort the previous request if it exists
            controller.current.renew();

            const url = props.frame.x_url || SITE_URL;

            const u = parseUrl(url);
            if (!u) throw new Error(`Invalid URL: ${props.frame.x_url}`);

            const response = await fetchJson<{
                url: string;
                channelToken: string;
            }>(urlcat(FARCASTER_REPLY_URL, '/v1/channel'), {
                method: 'POST',
                body: JSON.stringify({
                    nonce: props.options.nonce,
                    domain: u.hostname,
                    siweUri: url,
                }),
            });

            return {
                schemaUrl: response.url,
                channelToken: response.channelToken,
            };
        },
        enabled: !!props,
    });

    useQuery({
        queryKey: ['farcaster-relay-sign', data?.channelToken],
        queryFn: async () => {
            if (!props) return;
            if (!data?.channelToken) return;

            const signed = await pollingChannelToken(data.channelToken, controller.current.signal);
            const currentProfile = getCurrentProfile(Source.Farcaster);

            captureFrameSignInEvent('siwf', props.frame);

            if (currentProfile && `${signed.fid}` === currentProfile.profileId) {
                dispatch?.close({
                    authMethod: 'custody',
                    message: signed.message,
                    signature: signed.signature,
                });
            } else {
                const profile = createDummyProfile(Source.Farcaster);

                profile.profileId = `${signed.fid}`;
                profile.handle = signed.username;
                profile.displayName = signed.displayName;
                profile.pfp = signed.pfpUrl;

                setScannedProfile(profile);
            }
        },
        enabled: !!data?.channelToken && !!props,
    });

    return (
        <Popover
            title={<Trans>Sign in with Farcaster</Trans>}
            content={
                <div className="relative flex flex-col items-center justify-center gap-2 py-2">
                    <ClickableArea
                        className={classNames('overflow-hidden rounded-2xl bg-white', {
                            'cursor-pointer': !isLoading,
                        })}
                        disabled={isLoading}
                        onClick={() => {
                            refetch();
                            setScannedProfile(null);
                        }}
                    >
                        {isError ? (
                            <div className="flex h-[200px] w-[200px] items-center justify-center gap-2 p-6">
                                <p>
                                    <Trans>Something went wrong, please try again.</Trans>
                                </p>
                                <ClickableButton>
                                    <Trans>Retry</Trans>
                                </ClickableButton>
                            </div>
                        ) : isLoading || isRefetching || !data ? (
                            <div className="p-4 text-black">
                                <div className="flex h-[200px] w-[200px] items-center justify-center">
                                    <LoadingIcon />
                                </div>
                            </div>
                        ) : (
                            <ScannableQRCode
                                url={data.schemaUrl}
                                scanned={!!scannedProfile}
                                countdown={scannedProfile ? 0 : Number.POSITIVE_INFINITY}
                                size={200}
                                iconSize={60}
                            />
                        )}
                    </ClickableArea>
                    {profile ? (
                        <div className="flex max-w-[80%] items-center justify-center gap-2">
                            <ProfileAvatar className="flex-1" size={24} profile={profile} enableSourceIcon={false} />
                            <p className="truncate text-secondary">{profile.displayName}</p>
                        </div>
                    ) : null}
                    <div className="mt-3 px-6 text-xs">
                        {scannedProfile ? (
                            <Trans>
                                You&apos;re trying to connect a different account than the one currently active on
                                Firefly. Please try again.
                            </Trans>
                        ) : (
                            <Trans>
                                Scan this QR code and confirm on your Farcaster mobile app to start using your public
                                profile.
                            </Trans>
                        )}
                    </div>
                </div>
            }
            frame={props?.frame}
            open={open}
            onClose={() => dispatch?.close(null)}
        />
    );
}
