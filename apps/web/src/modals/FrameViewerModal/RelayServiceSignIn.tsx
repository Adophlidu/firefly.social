import { Source } from '@dimensiondev/enums';
import { classNames, parseUrl } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { rootRouteId, useRouteContext } from '@tanstack/react-router';
import { useState } from 'react';
import urlcat from 'urlcat';

import { ClickableArea } from '@/components/ClickableArea.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';

import { FARCASTER_REPLY_URL, SITE_URL } from '@/constants/static.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { logger } from '@/libs/Logger.js';
import type { RelayConfirmationContext } from '@/modals/FrameViewerModal/RelayConfirmationRouter.js';
import { captureFrameSignInEvent } from '@/providers/telemetry/captureFrameSignInEvent.js';
import { type Profile, SessionType } from '@/providers/types/SocialMedia.js';
import { pollingChannelToken } from '@/providers/warpcast/pollingChannelToken.js';

export function RelayServiceSignIn() {
    const controller = useAbortController();
    const [scannedProfile, setScannedProfile] = useState<Profile | null>(null);
    const context = useRouteContext({ from: rootRouteId });
    const { frame, options, onClose } = context as RelayConfirmationContext;

    const { isLoading, isRefetching, isError, data, refetch } = useQuery({
        queryKey: ['farcaster-relay-channel', frame, options],
        queryFn: async () => {
            setScannedProfile(null);
            controller.current.renew();

            const url = frame.x_url || SITE_URL;
            const u = parseUrl(url);
            if (!u) throw new Error(`Invalid URL: ${frame.x_url}`);

            const response = await fetchJson<{
                url: string;
                channelToken: string;
            }>(urlcat(FARCASTER_REPLY_URL, '/v1/channel'), {
                method: 'POST',
                body: JSON.stringify({
                    nonce: options.nonce,
                    domain: u.hostname,
                    siweUri: url,
                }),
            });

            return {
                schemaUrl: response.url,
                channelToken: response.channelToken,
            };
        },
        enabled: true,
    });

    useQuery({
        queryKey: ['farcaster-relay-sign', data?.channelToken],
        queryFn: async () => {
            if (!data?.channelToken) return;

            const signed = await pollingChannelToken(data.channelToken, controller.current.signal);
            logger.info(`[RelayServiceSignIn] signed`, signed);

            const session = getSessionFromStorage(SessionType.Farcaster);

            captureFrameSignInEvent('siwf', frame);

            if (`${signed.fid}` === session?.profileId) {
                onClose({
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
        enabled: !!data?.channelToken,
    });

    return (
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
                    <div className="text-primaryBottom flex size-[232px] flex-col items-center justify-center gap-2 p-6 text-sm">
                        <Trans>Something went wrong, please try again.</Trans>
                    </div>
                ) : isLoading || isRefetching || !data ? (
                    <div className="p-4 text-black">
                        <div className="flex size-[200px] items-center justify-center">
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

            <div className="mt-3 px-6 text-xs">
                {scannedProfile ? (
                    <Trans>
                        You&apos;re trying to connect a different account than the one currently active on Firefly.
                        Please try again.
                    </Trans>
                ) : (
                    <Trans>
                        Scan this QR code and confirm on your Farcaster mobile app to start using your public profile.
                    </Trans>
                )}
            </div>
        </div>
    );
}
