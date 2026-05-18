'use client';

import CloudIcon from '@dimensiondev/assets/cloud.svg';
import EditIcon from '@dimensiondev/assets/edit.svg';
import LogoutIcon from '@dimensiondev/assets/log-out.svg';
import MoreIcon from '@dimensiondev/assets/more-fill.svg';
import ScanIcon from '@dimensiondev/assets/scan.svg';
import { PageRoute, PasswordWorkflow, SessionType, Source } from '@dimensiondev/enums';
import { MenuButton as HeadlessMenuButton, MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { Avatar } from '@/components/Avatar.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { useRouter as useNextRouter } from '@/esm/navigation.js';
import { enqueueMessageFromError, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getAccountsFromStorage } from '@/helpers/getAccountsFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { useFireflyAccountAvatar } from '@/hooks/useFireflyAccountAvatar.js';
import { EditFireflyProfileModalRef } from '@/modals/EditFireflyProfileModal/refs.js';
import { LoginModalRef } from '@/modals/LoginModal/refs.js';
import { LogoutModalRef } from '@/modals/LogoutModal/refs.js';
import { PasswordModalRef } from '@/modals/PasswordModal/refs.js';
import { SignInToFireflyAppModalRef } from '@/modals/SignInToFireflyAppModal/refs.js';
import { getMetricsStatus } from '@/providers/firefly/metrics/getMetricsStatus.js';
import { captureEditProfileClickEvent } from '@/providers/telemetry/captureProfileActionEvent.js';
import { captureMultiDeviceLoginClickEvent } from '@/providers/telemetry/captureSyncTokenEvent.js';
import type { AllConnections, FireflyAccountProfile } from '@/providers/types/Firefly.js';
import { mergeMetrics } from '@/services/metrics.js';
import { verifyAndGetPassword } from '@/services/verifyAndGetPassword.js';

interface FireflyAccountProps {
    profile?: FireflyAccountProfile;
    connections?: AllConnections;
    onChangeMenuOpenStatus?: (open: boolean) => void;
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
        <div className="border-highlight flex h-[76px] items-center gap-2 rounded-lg border px-2">
            <Avatar src={avatar} size={60} alt={profile.uid ?? ''} />
            <div className="mr-auto flex h-[60px] flex-col items-start justify-center text-sm">
                {!profile.avatar || !profile.displayName ? (
                    <ClickableButton
                        className="text-highlight h-5 cursor-pointer text-sm font-bold leading-5 hover:underline"
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
                <span className="text-secondary h-5 leading-5">UID: {profile?.uid}</span>
            </div>
            <MoreActionMenu
                className="z-10"
                loginRequired={false}
                onMenuOpenChange={onChangeMenuOpenStatus}
                menuButton={
                    <HeadlessMenuButton className="flex size-5 items-center justify-center rounded-lg">
                        <MoreIcon className="size-5 shrink-0" />
                    </HeadlessMenuButton>
                }
            >
                <MenuGroup className="w-[186px]">
                    <MenuItem>
                        {({ close }) => (
                            <MenuButton
                                className="w-full"
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
                                <EditIcon width={18} height={18} />
                                <span className="text-main font-bold leading-[22px]">
                                    <Trans>Edit profile</Trans>
                                </span>
                            </MenuButton>
                        )}
                    </MenuItem>
                    <MenuItem>
                        {({ close }) => (
                            <MenuButton
                                className="w-full"
                                onClick={() => {
                                    close();
                                    if (hasOnlyTwitterAccounts()) {
                                        enqueueWarningMessage(
                                            <Trans>X desktop login is currently unavailable on mobile.</Trans>,
                                        );
                                        return;
                                    }
                                    LoginModalRef.close();
                                    SignInToFireflyAppModalRef.open();
                                }}
                            >
                                <ScanIcon width={18} height={18} />
                                <span className="text-main font-bold leading-[22px]">
                                    <Trans>Sign in on mobile</Trans>
                                </span>
                            </MenuButton>
                        )}
                    </MenuItem>
                    <MenuItem>
                        {({ close }) => (
                            <MenuButton
                                className="w-full"
                                disabled={queryMetricsStatusLoading}
                                onClick={async () => {
                                    if (queryMetricsStatusLoading) return;
                                    captureMultiDeviceLoginClickEvent();
                                    await queryMetricsStatus();
                                    close();
                                }}
                            >
                                {queryMetricsStatusLoading ? (
                                    <LoadingIcon size={18} className="shrink-0" />
                                ) : (
                                    <CloudIcon width={18} height={18} />
                                )}
                                <span className="text-main min-w-0 flex-1 text-left font-bold leading-[22px]">
                                    <Trans>Multi-device login</Trans>
                                </span>
                            </MenuButton>
                        )}
                    </MenuItem>
                    <MenuItem>
                        {({ close }) => (
                            <MenuButton
                                className="w-full"
                                onClick={() => {
                                    close();
                                    LoginModalRef.close();
                                    LogoutModalRef.open();

                                    router.prefetch(PageRoute.Signup);
                                }}
                            >
                                <LogoutIcon width={18} height={18} className="text-danger" />
                                <span className="text-danger font-bold leading-[22px]">
                                    <Trans>Log out</Trans>
                                </span>
                            </MenuButton>
                        )}
                    </MenuItem>
                </MenuGroup>
            </MoreActionMenu>
        </div>
    );
});
