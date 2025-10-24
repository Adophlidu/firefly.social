'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation.js';
import { memo, useCallback, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useMount } from 'react-use';
import urlcat from 'urlcat';

import ReloadIcon from '@/assets/reload.svg';
import { CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { SITE_URL, SITE_URL_OFFICIAL } from '@/constants/index.js';
import { Link } from '@/esm/Link.js';
import { bom } from '@/helpers/bom.js';
import { classNames } from '@/helpers/classNames.js';
import { delay } from '@/helpers/delay.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openAppSchemes } from '@/helpers/openAppSchemes.js';
import { usePollingAppScanLogin } from '@/hooks/usePollingAppScanLogin.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { DeviceType } from '@/types/device.js';

interface Props {
    ref: React.Ref<SingletonModalRefCreator>;
}

function generateOTP() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const number = array[0] % 1000000;
    return number.toString().padStart(6, '0');
}

export const SignInWithFireflyAppModal = memo(function SignInWithFireflyAppModal({ ref }: Props) {
    const [open, dispatch] = useSingletonModal(ref);
    const queryClient = useQueryClient();
    const onClose = useCallback(async () => {
        dispatch?.close();
        await delay(300);
        queryClient.removeQueries({ queryKey: ['desktop-link-info-session'] });
        queryClient.removeQueries({ queryKey: ['sign-in-with-firefly-app-otp'] });
    }, [dispatch, queryClient]);

    return (
        <Modal onClose={onClose} open={open}>
            <div className="relative rounded-[12px] bg-primaryBottom text-second transition-all max-md:h-full md:w-[500px]">
                <Header onClose={onClose} />
                <div className="flex w-full flex-col items-center space-y-3 px-6 pb-6 text-xs">
                    <Content enabled={open} onClose={onClose} />
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
                <Trans>Sign in with Firefly App</Trans>
            </h3>
            <div className="relative size-6" />
        </div>
    );
}

function Content({ enabled, onClose }: { enabled: boolean; onClose?: () => void }) {
    const { data: otp, refetch: refetchOTP } = useQuery({
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

    const [isInvalid, setIsInvalid] = useState(false);
    useEffect(() => {
        if (linkInfoData?.session) setIsInvalid(false);
    }, [linkInfoData?.session]);

    const { loading: isSigning } = usePollingAppScanLogin(otp, linkInfoData?.session, {
        enabled,
        onSuccess() {
            enqueueSuccessMessage(<Trans>Your Firefly Account is now connected</Trans>);
            onClose?.();
        },
        onCancel: onClose,
        onExpired() {
            setIsInvalid(true);
        },
    });

    const schemaURL = linkInfoData
        ? urlcat('firefly://account/scan/desktop-login', {
              session: linkInfoData.session,
              otp,
          })
        : null;

    const loading = isLoading || isRefetching || isSigning;

    return (
        <>
            {IS_MOBILE_DEVICE ? (
                schemaURL && linkInfoData && otp ? (
                    <SchemaLink url={schemaURL} session={linkInfoData.session} otp={otp} />
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
                        onClick={async () => {
                            await refetchDesktopLinkInfo();
                            await refetchOTP();
                            setIsInvalid(false);
                        }}
                    >
                        {!loading && schemaURL ? (
                            <QRCode
                                value={schemaURL}
                                size={246}
                                className={classNames({
                                    'blur-md': isInvalid,
                                })}
                            />
                        ) : null}
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-xs text-black">
                                {isSigning ? (
                                    <span className="mb-2">
                                        <Trans>Signing in...</Trans>
                                    </span>
                                ) : null}
                                <LoadingIcon />
                            </div>
                        ) : isInvalid ? (
                            <ReloadIcon className="absolute inset-0 m-auto text-white" width={80} height={80} />
                        ) : null}
                    </div>
                </>
            )}
            <div className="align-center flex w-full flex-col justify-center">
                <div className="leading-6">Ensure the pair code matches</div>
                <div className="h-6 text-lg font-bold leading-6">{otp}</div>
            </div>
        </>
    );
}

function SchemaLink({ url, session, otp }: { url: string; otp: string; session: string }) {
    const router = useRouter();
    useMount(async () => {
        await openAppSchemes({
            [DeviceType.IOS]: url,
            [DeviceType.Android]: url,
        });
        router.replace(
            urlcat(bom.location?.origin ?? SITE_URL, '/redirect/login/scan/:session/:otp', {
                session,
                otp,
            }),
        );
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

export const SignInWithFireflyAppModalRef = new SingletonModal();
