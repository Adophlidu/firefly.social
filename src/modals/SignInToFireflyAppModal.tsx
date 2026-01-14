'use client';

import { classNames, delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useState } from 'react';
import QRCode from 'react-qr-code';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import ReloadIcon from '@/assets/reload.svg';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { SITE_URL_OFFICIAL } from '@/constants/static.js';
import { Link } from '@/esm/Link.js';
import { usePollingSyncChannelStatus } from '@/hooks/usePollingSyncChannelStatus.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { confirmSyncChannel } from '@/providers/firefly/endpoint/confirmSyncChannel.js';
import { getDesktopSyncLinkInfo } from '@/providers/firefly/endpoint/getDesktopSyncLinkInfo.js';
import { uploadSyncData } from '@/providers/firefly/endpoint/uploadSyncData.js';
import { captureSignInToAppClickEvent } from '@/providers/telemetry/captureSyncTokenEvent.js';
import { encryptLoginAppAccountPayload } from '@/services/encryptLoginAppAccountPayload.js';

interface Props {
    ref: React.Ref<SingletonModalRefCreator>;
}

function generateCryptoKey() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const number = array[0] % 1000000;
    return number.toString().padStart(6, '0');
}

export const SignInToFireflyAppModal = memo(function SignInToFireflyAppModal({ ref }: Props) {
    const [open, dispatch] = useSingletonModal(ref);
    const queryClient = useQueryClient();
    const onClose = useCallback(async () => {
        dispatch?.close();
        await delay(300);
        queryClient.removeQueries({ queryKey: ['desktop-sync-link-info-session'] });
    }, [dispatch, queryClient]);

    return (
        <Modal size="md" title={<Trans>Sign in within Firefly App</Trans>} enableClose onClose={onClose} open={open}>
            <div className="relative rounded-[12px] bg-lightBottom text-second transition-all dark:bg-darkBottom">
                <div className="flex w-full flex-col items-center space-y-3 text-xs">
                    <Content enabled={open} onClose={onClose} />
                </div>
            </div>
        </Modal>
    );
});

function Content({ enabled, onClose }: { enabled: boolean; onClose?: () => void }) {
    const [cryptoKey, setCryptoKey] = useState(generateCryptoKey);
    const regenerateCryptoKey = () => setCryptoKey(generateCryptoKey);
    const [invalidMap, setInvalidMap] = useState<Record<string, boolean>>({});

    const {
        isLoading,
        isRefetching,
        data: linkInfoData,
        refetch: refetchDesktopLinkInfo,
    } = useQuery({
        queryKey: ['desktop-sync-link-info-session', cryptoKey],
        queryFn() {
            return getDesktopSyncLinkInfo();
        },
        enabled,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });

    const session = linkInfoData?.session;
    const isInvalid = session ? invalidMap[session] : false;

    const [{ loading: isUploading }, confirmAndUpload] = useAsyncFn(async () => {
        if (!session || !cryptoKey) return;

        await confirmSyncChannel(session, 'confirm');

        // Get all profiles and encrypt the account data
        const encryptedData = await encryptLoginAppAccountPayload(cryptoKey);

        await uploadSyncData(session, encryptedData);

        onClose?.();
    }, [session, cryptoKey, onClose]);

    const [{ loading: isCanceling }, handleCancel] = useAsyncFn(async () => {
        if (!session) return;

        await confirmSyncChannel(session, 'cancel');
        regenerateCryptoKey();
        refetchDesktopLinkInfo();
    }, [refetchDesktopLinkInfo, session]);

    usePollingSyncChannelStatus({
        enabled,
        session: linkInfoData?.session,
        async onScanned() {
            const confirmed = await ConfirmModalRef.openAndWaitForClose({
                title: <Trans>Sign in Confirmation</Trans>,
                variant: 'normal',
                content: (
                    <div className="mb-3 mt-4 text-center text-sm font-normal leading-[18px] text-[rgba(70,70,70,0.8)]">
                        <Trans>
                            Your account is requesting to sign in to mobile. Please confirm that the device is with you
                            and that it is you who is signing in
                        </Trans>
                    </div>
                ),
                enableCancelButton: true,
                enableCloseButton: false,
            });
            if (confirmed) {
                captureSignInToAppClickEvent();
                confirmAndUpload();
                onClose?.();
            } else {
                handleCancel();
            }
        },
        onExpired() {
            if (session) setInvalidMap((x) => ({ ...x, [session]: true }));
        },
    });

    const schemaURL = linkInfoData
        ? urlcat('firefly://account/scan/desktop-sync', {
              session: linkInfoData.session,
              cryptoKey,
          })
        : null;

    const loading = isLoading || isRefetching || isUploading || isCanceling;

    return (
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
                    to sign in directly within the app.
                </Trans>
            </p>
            <div
                className="relative flex size-[270px] items-center justify-center rounded-2xl bg-white shadow-primary"
                onClick={async () => {
                    await refetchDesktopLinkInfo();
                    regenerateCryptoKey();
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
                        <LoadingIcon />
                    </div>
                ) : isInvalid ? (
                    <ReloadIcon className="absolute inset-0 m-auto text-white" width={80} height={80} />
                ) : null}
            </div>
            <div className="align-center flex w-full flex-col justify-center">
                <div className="leading-6">
                    <Trans>Note: X desktop login is currently unavailable on mobile.</Trans>
                </div>
            </div>
        </>
    );
}

export const SignInToFireflyAppModalRef = new SingletonModal();
