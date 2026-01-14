'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo, useEffect } from 'react';
import { useAsyncFn } from 'react-use';

import CloudIcon from '@/assets/cloud.svg';
import EditIcon from '@/assets/edit.svg';
import LogoutIcon from '@/assets/log-out.svg';
import MoreIcon from '@/assets/more-fill.svg';
import ScanIcon from '@/assets/scan.svg';
import { Avatar } from '@/components/Avatar.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { PageRoute, PasswordWorkflow, Source } from '@/constants/enum.js';
import { useRouter as useNextRouter } from '@/esm/navigation.js';
import { enqueueMessageFromError, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getAccountsFromStorage } from '@/helpers/getAccountsFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { useFireflyAccountAvatar } from '@/hooks/useFireflyAccountAvatar.js';
import { EditFireflyProfileModalRef } from '@/modals/EditFireflyProfileModal/EditFireflyProfileModal.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { LogoutModalRef } from '@/modals/LogoutModal.js';
import { PasswordModalRef } from '@/modals/PasswordModal/index.js';
import { SignInToFireflyAppModalRef } from '@/modals/SignInToFireflyAppModal.js';
import { getMetricsStatus } from '@/providers/firefly/metrics/getMetricsStatus.js';
import { captureEditProfileClickEvent } from '@/providers/telemetry/captureProfileActionEvent.js';
import { captureMultiDeviceLoginClickEvent } from '@/providers/telemetry/captureSyncTokenEvent.js';
import { type AllConnections, type FireflyAccountProfile } from '@/providers/types/Firefly.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { mergeMetrics } from '@/services/metrics.js';
import { verifyAndGetPassword } from '@/services/verifyAndGetPassword.js';

interface FireflyAccountProps {
    profile?: FireflyAccountProfile;
    connections?: AllConnections;
    onChangeMenuOpenStatus?: (open: boolean) => void;
}
interface HandleMenuOpenProps {
    open: boolean;
    onChange?: (open: boolean) => void;
}

function HandleMenuOpen({ open, onChange }: HandleMenuOpenProps) {
    useEffect(() => {
        onChange?.(open);
    }, [open, onChange]);
    return null;
}

function hasOnlyTwitterAccounts(): boolean {
    const fireflySession = getSessionFromStorage(SessionType.Firefly);
    const farcasterAccounts = getAccountsFromStorage(Source.Farcaster);
    const lensAccounts = getAccountsFromStorage(Source.Lens);
    const twitterAccounts = getAccountsFromStorage(Source.Twitter);
    const bskyAccounts = getAccountsFromStorage(Source.Bsky);

    const hasTwitter = twitterAccounts.length > 0;
    const hasOtherAccounts =
        !!fireflySession?.token || farcasterAccounts.length > 0 || lensAccounts.length > 0 || bskyAccounts.length > 0;

    return hasTwitter && !hasOtherAccounts;
}

export const FireflyAccount = memo<FireflyAccountProps>(function FireflyAccount({
    profile,
    connections,
    onChangeMenuOpenStatus,
}) {
    const router = useNextRouter();
    const avatar = useFireflyAccountAvatar();

    const [{ loading: queryMetricsStatusLoading }, queryMetricsStatus] = useAsyncFn(async () => {
        try {
            const status = await getMetricsStatus();
            if (status.hasSetPasscode) {
                const password = await verifyAndGetPassword({
                    skipCheck: true,
                    autoUploadMetrics: false,
                });
                if (password) {
                    await mergeMetrics(password);
                }
            } else {
                await PasswordModalRef.openAndWaitForClose({
                    workflow: PasswordWorkflow.Set,
                });
            }
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Something went wrong.</Trans>);
            throw error;
        }
    }, []);

    if (!profile) return null;

    return (
        <div className="flex h-[76px] items-center gap-2 rounded-lg border border-highlight px-2">
            <Avatar src={avatar} size={60} alt={profile.uid ?? ''} />
            <div className="mr-auto flex h-[60px] flex-col items-start justify-center text-sm">
                {!profile.avatar || !profile.displayName ? (
                    <ClickableButton
                        className="h-5 cursor-pointer text-sm font-bold leading-5 text-highlight hover:underline"
                        onClick={() => {
                            EditFireflyProfileModalRef.open({
                                profile,
                                connections,
                            });
                        }}
                        aria-label="Edit Profile"
                    >
                        <Trans>Edit Profile</Trans>
                    </ClickableButton>
                ) : (
                    <span className="h-5 font-bold leading-5">{profile?.displayName || 'Firefly Account'}</span>
                )}
                <span className="h-5 leading-5 text-secondary">UID: {profile?.uid}</span>
            </div>
            <Menu>
                {({ open }) => {
                    return (
                        <div>
                            <HandleMenuOpen open={open} onChange={onChangeMenuOpenStatus} />
                            <MenuButton className="flex size-5 items-center justify-center rounded-lg">
                                <MoreIcon className="size-5 shrink-0" />
                            </MenuButton>
                            <MenuItems
                                transition
                                anchor="bottom end"
                                className="z-50 w-[186px] origin-top-right rounded-lg bg-primaryBottom py-3 font-normal shadow-messageShadow outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                            >
                                <MenuItem>
                                    {({ close }) => (
                                        <button
                                            className="flex w-full items-center whitespace-nowrap px-3 py-1 text-base font-bold"
                                            onClick={() => {
                                                EditFireflyProfileModalRef.open({
                                                    profile,
                                                    connections,
                                                });
                                                LoginModalRef.close();
                                                close();
                                                captureEditProfileClickEvent();
                                            }}
                                        >
                                            <EditIcon className="mr-2 size-[18px]" />
                                            <Trans>Edit profile</Trans>
                                        </button>
                                    )}
                                </MenuItem>
                                <MenuItem>
                                    {({ close }) => (
                                        <button
                                            className="flex w-full items-center whitespace-nowrap px-3 py-1 text-base font-bold"
                                            onClick={() => {
                                                close();
                                                if (hasOnlyTwitterAccounts()) {
                                                    enqueueWarningMessage(
                                                        <Trans>
                                                            X desktop login is currently unavailable on mobile.
                                                        </Trans>,
                                                    );
                                                    return;
                                                }
                                                LoginModalRef.close();
                                                SignInToFireflyAppModalRef.open();
                                            }}
                                        >
                                            <ScanIcon className="mr-2 size-[18px]" />
                                            <Trans>Sign In to Mobile</Trans>
                                        </button>
                                    )}
                                </MenuItem>
                                <MenuItem>
                                    {({ close }) => (
                                        <button
                                            className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-1 text-base font-bold"
                                            onClick={async () => {
                                                if (queryMetricsStatusLoading) return;
                                                captureMultiDeviceLoginClickEvent();
                                                await queryMetricsStatus();
                                                close();
                                                return;
                                            }}
                                        >
                                            {queryMetricsStatusLoading ? (
                                                <LoadingIcon size={18} className="flex-1" />
                                            ) : (
                                                <CloudIcon className="size-[18px] min-w-[18px] max-w-[18px]" />
                                            )}
                                            <span className="flex-1 text-left">
                                                <Trans>Multi-device login</Trans>
                                            </span>
                                        </button>
                                    )}
                                </MenuItem>
                                <MenuItem>
                                    {({ close }) => (
                                        <button
                                            className="flex w-full items-center whitespace-nowrap px-3 py-1 text-base font-bold text-danger"
                                            onClick={() => {
                                                close();
                                                LoginModalRef.close();
                                                LogoutModalRef.open();

                                                router.prefetch(PageRoute.Signup);
                                            }}
                                        >
                                            <LogoutIcon className="mr-2 size-[18px]" />
                                            <span className="leading-6">
                                                <Trans>Log out</Trans>
                                            </span>
                                        </button>
                                    )}
                                </MenuItem>
                            </MenuItems>
                        </div>
                    );
                }}
            </Menu>
        </div>
    );
});
