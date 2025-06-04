'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { memo, type Ref, useState } from 'react';
import QRCode from 'react-qr-code';
import { useInterval, useMount } from 'react-use';
import urlcat from 'urlcat';

import ReloadIcon from '@/assets/reload.svg';
import { CloseButton } from '@/components/IconButton.js';
import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { SITE_URL, SITE_URL_OFFICIAL } from '@/constants/index.js';
import { bom } from '@/helpers/bom.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openAppSchemes } from '@/helpers/openAppSchemes.js';
import { usePollingAppScanLogin } from '@/hooks/usePollingAppScanLogin.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { DeviceType } from '@/types/device.js';

interface Props {
    ref: Ref<SingletonModalRefCreator>;
}

function generateOTP() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const number = array[0] % 1000000;
    return number.toString().padStart(6, '0');
}

function useExpires(expiresAt?: string, enabled = true) {
    const [isExpired, setIsExpired] = useState(false);
    useInterval(
        () => {
            const expired = dayjs().isAfter(dayjs(expiresAt));
            if (!expired) return;
            setIsExpired(true);
        },
        enabled && expiresAt ? 1000 : null,
    );
    return isExpired;
}

export const SignInWithFireflyAppModal = memo(function SignInWithFireflyAppModal({ ref }: Props) {
    const [open, dispatch] = useSingletonModal(ref);
    const onClose = () => dispatch?.close();

    return (
        <Modal onClose={onClose} open={open}>
            <div className="transform rounded-[12px] bg-primaryBottom text-second transition-all max-md:h-full md:w-[500px]">
                <Header onClose={onClose} />
                <div className="flex w-full flex-col items-center space-y-3 px-6 pb-6 text-xs">
                    <Content
                        enabled={open}
                        onSuccess={() => {
                            enqueueSuccessMessage(t`Your Firefly Account is now connected`);
                            onClose();
                        }}
                        onCancel={() => onClose()}
                    />
                </div>
            </div>
        </Modal>
    );
});

function Header({ onClose }: { onClose: () => void }) {
    return (
        <div className="flex items-center justify-center gap-2 rounded-t-[12px] p-4">
            <CloseButton onClick={() => onClose()} />
            <h3 className="shrink grow basis-0 text-center text-lg font-bold leading-snug text-main">
                <Trans>Sign In With Firefly App Modal</Trans>
            </h3>
            <div className="relative h-6 w-6" />
        </div>
    );
}

function Content({
    enabled,
    onSuccess,
    onCancel,
}: {
    enabled: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}) {
    const { data: otp } = useQuery({
        queryKey: ['sign-in-with-firefly-app-otp'],
        queryFn() {
            return generateOTP();
        },
        enabled,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const {
        isLoading,
        isRefetching,
        data: linkInfoData,
        refetch: refetchDesktopLinkInfo,
    } = useQuery({
        queryKey: ['desktop-link-info-session'],
        queryFn() {
            return FireflyEndpointProvider.getDesktopLinkInfo();
        },
        enabled,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });

    const { loading: isLogging } = usePollingAppScanLogin(otp, linkInfoData?.session, {
        enabled,
        onSuccess,
        onCancel,
    });

    const isExpired = useExpires(linkInfoData?.expiresAt, enabled);

    const schemaURL = linkInfoData
        ? urlcat('firefly://account/scan/desktop-login', {
              session: linkInfoData.session,
              otp,
              ...(IS_MOBILE_DEVICE
                  ? {
                        callback_url: urlcat(bom.location?.origin ?? SITE_URL, '/redirect/login/scan/:session/:otp', {
                            session: linkInfoData.session,
                            otp,
                        }),
                    }
                  : {}),
          })
        : null;

    return (
        <>
            {IS_MOBILE_DEVICE ? (
                schemaURL ? (
                    <SchemaLink url={schemaURL} />
                ) : (
                    <div className="align-center flex h-[270px] flex-col items-center justify-center">
                        <LoadingIcon />
                    </div>
                )
            ) : (
                <>
                    <p className="leading-4">
                        <Trans>
                            Scan the QR code with the{' '}
                            <Link
                                href={`${SITE_URL_OFFICIAL}/about`}
                                target="_blank"
                                className="font-bold text-highlight hover:underline"
                            >
                                Firefly mobile app
                            </Link>
                            <br />
                            or <b className="font-bold">Camera app</b> to sign in instantly
                        </Trans>
                    </p>
                    <div
                        className="relative flex size-[270px] items-center justify-center rounded-2xl bg-white shadow-primary"
                        onClick={() => refetchDesktopLinkInfo()}
                    >
                        {schemaURL ? (
                            <QRCode
                                value={schemaURL}
                                size={246}
                                className={classNames({
                                    'blur-md': isExpired,
                                })}
                            />
                        ) : null}
                        {isLoading || isRefetching || isLogging ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-black">
                                <LoadingIcon />
                            </div>
                        ) : isExpired ? (
                            <ReloadIcon className="absolute inset-0 m-auto text-white" width={80} height={80} />
                        ) : null}
                    </div>
                </>
            )}
            <div className="align-center flex w-full flex-col justify-center">
                <div className="leading-6">Ensure the pair code matches</div>
                <div className="text-lg font-bold leading-6">{otp}</div>
            </div>
        </>
    );
}

function SchemaLink({ url }: { url: string }) {
    useMount(async () => {
        await openAppSchemes({
            [DeviceType.IOS]: url,
            [DeviceType.Android]: url,
        });
    });
    return (
        <div className="align-center flex h-[270px] flex-col items-center justify-center text-center">
            <LoadingIcon />
            <span className="mt-2">
                <Trans>Please confirm login in the app</Trans>
            </span>
        </div>
    );
}
