'use client';

import { classNames, delay, safeUnreachable } from '@dimensiondev/utils';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { rootRouteId, useMatch, useRouter } from '@tanstack/react-router';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import CloudIcon from '@/assets/cloud.svg';
import EditIcon from '@/assets/edit.svg';
import FireflyAvatar from '@/assets/firefly.round.svg';
import LogoutIcon from '@/assets/log-out.svg';
import MoreIcon from '@/assets/more-fill.svg';
import PlusIcon from '@/assets/plus.svg';
import ScanIcon from '@/assets/scan.svg';
import SwitchIcon from '@/assets/switch.svg';
import { Avatar } from '@/components/Avatar.js';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { PageRoute, PasswordWorkflow, type SocialSource, Source, type ThirdPartySource } from '@/constants/enum.js';
import { TokenExpiredError } from '@/constants/error.js';
import { SORTED_LOGIN_SOCIAL_SOURCES, SORTED_THIRD_PARTY_SOURCES_IN_URL } from '@/constants/index.js';
import { usePathname, useRouter as useNextRouter } from '@/esm/navigation.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { formatAccountFromConnections } from '@/helpers/formatAccountFromConnections.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { isSameAccount } from '@/helpers/isSameAccount.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useFireflyAccountAvatar } from '@/hooks/useFireflyAccountAvatar.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { useUpdateParams } from '@/hooks/useUpdateParams.js';
import { EditFireflyProfileModalRef } from '@/modals/EditFireflyProfileModal/EditFireflyProfileModal.js';
import { type LoginModalOpenProps, LoginModalRef } from '@/modals/LoginModal/index.js';
import { LogoutModalRef } from '@/modals/LogoutModal.js';
import { PasswordModalRef } from '@/modals/PasswordModal/index.js';
import { SignInWithFireflyAppModalRef } from '@/modals/SignInWithFireflyAppModal.js';
import { getTelegramLoginUrl } from '@/providers/firefly/auth/getTelegramLoginUrl.js';
import { getMetricsStatus } from '@/providers/firefly/metrics/getMetricsStatus.js';
import { formatThirdPartyProfileName } from '@/providers/lens/formatThirdPartyProfileName.js';
import { captureEditProfileClickEvent } from '@/providers/telemetry/captureProfileActionEvent.js';
import {
    captureMobileQrLoginClickEvent,
    captureMultiDeviceLoginClickEvent,
} from '@/providers/telemetry/captureSyncTokenEvent.js';
import type { Account } from '@/providers/types/Account.js';
import type { AllConnections, FireflyAccountProfile } from '@/providers/types/Firefly.js';
import { switchAccount } from '@/services/account.js';
import { mergeMetrics } from '@/services/metrics.js';
import { verifyAndGetPassword } from '@/services/verifyAndGetPassword.js';
import { useFireflyIdentityState } from '@/store/useFireflyIdentityStore.js';

function FireflyAccountLoadingSkeleton() {
    return (
        <div className="flex h-[76px] animate-pulse items-center gap-2 rounded-lg px-2">
            <div className="size-[60px] shrink-0 rounded-full bg-bg" />
            <div className="flex h-[60px] flex-col items-start justify-center">
                <div className="mb-2 h-3 w-[80px] rounded-lg bg-bg" />
                <div className="h-3 w-[120px] rounded-lg bg-bg" />
            </div>
        </div>
    );
}

function HandleMenuOpen({ open, onChange }: { open: boolean; onChange?: (open: boolean) => void }) {
    useEffect(() => {
        onChange?.(open);
    }, [open, onChange]);
    return null;
}

function FireflyAccount({
    profile,
    connections,
    onChangeMenuOpenStatus,
}: {
    profile?: FireflyAccountProfile;
    connections?: AllConnections;
    onChangeMenuOpenStatus?: (open: boolean) => void;
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
                        <>
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
                                                LoginModalRef.close();
                                                captureMobileQrLoginClickEvent();
                                                SignInWithFireflyAppModalRef.open();
                                            }}
                                        >
                                            <ScanIcon className="mr-2 size-[18px]" />
                                            <Trans>Mobile QR login</Trans>
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
                        </>
                    );
                }}
            </Menu>
        </div>
    );
}

function FireflyLoginButton() {
    return (
        <button
            className="flex h-[56px] w-full items-center gap-2 rounded-lg border border-highlight bg-bg px-2 text-left text-sm text-main"
            onClick={() => {
                LoginModalRef.close();
                captureMobileQrLoginClickEvent();
                SignInWithFireflyAppModalRef.open();
            }}
        >
            <FireflyAvatar className="size-[40px] shrink-0" width={40} height={40} />
            <span className="flex h-[40px] min-w-0 flex-1 flex-col items-start justify-center">
                <span className="h-5 w-full truncate leading-5">
                    <Trans>Firefly Mobile</Trans>
                </span>
                <span className="h-5 w-full truncate leading-5 text-second">
                    <Trans>Scan QR code to access your account</Trans>
                </span>
            </span>
            <span className="ml-auto size-5 shrink-0 cursor-pointer">
                <ScanIcon width={20} height={20} />
            </span>
        </button>
    );
}

export function MainView() {
    const router = useRouter();
    const { history } = router;
    const [selectedSource, setSelectedSource] = useState<ThirdPartySource>();
    const [isOpenFireflyAccountMenu, setIsOpenFireflyAccountMenu] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const isLoginFirefly = useIsLoginFirefly();
    const profileStore = useProfileStoreAll();
    const profilesAll = useCurrentProfilesAll();

    const { data, isLoading } = useAllConnections();

    const pathname = usePathname();
    const updateParams = useUpdateParams();
    const { identity } = useFireflyIdentityState();

    const isMyProfile = useIsMyRelatedProfile(identity.source, identity.id);

    const { context } = useMatch({ from: rootRouteId }) as {
        context: { props?: LoginModalOpenProps };
    };

    const isPureProfilePage = pathname === PageRoute.Profile;
    const isMyProfilePage = isMyProfile && (isPureProfilePage || isRoutePathname(pathname, PageRoute.Profile));
    const hideSocialLogin = context?.props?.options?.hideSocialLogin;

    const onClick = (source: SocialSource) => {
        const path = urlcat('/:source', {
            source: resolveSourceInUrl(source),
        });

        // history.back() is buggy, use .replace() instead.
        history.replace(path);
    };

    const [{ loading }, onAuthClick] = useAsyncFn(async (source: ThirdPartySource) => {
        try {
            setSelectedSource(source);
            switch (source) {
                case Source.Telegram:
                    const url = await getTelegramLoginUrl();
                    if (!url) return;
                    location.href = url;
                    break;
                case Source.Apple:
                case Source.Google:
                    await signIn(resolveSourceInUrl(source));
                    break;
                case Source.Email:
                    break;
                default:
                    safeUnreachable(source);
            }
        } finally {
            setSelectedSource(undefined);
        }
    }, []);

    const [{ loading: switchLoading }, onSwitchAccount] = useAsyncFn(
        async (account: Account) => {
            try {
                const source = account.profile.source;

                if (!account.session) {
                    await delay(300);
                    openLoginModal({
                        source,
                        options: { expectedProfile: account.profile.profileId },
                    });
                    return;
                }

                await switchAccount(account);

                if (
                    isMyProfilePage &&
                    identity.source === source &&
                    identity.id !== resolveFireflyProfileId(account.profile)
                ) {
                    updateParams(
                        new URLSearchParams({
                            source: resolveSourceInUrl(account.profile.source),
                        }),
                        isPureProfilePage
                            ? undefined
                            : urlcat('/profile/:id', {
                                  id: resolveFireflyProfileId(account.profile),
                              }),
                    );
                }

                enqueueSuccessMessage(<Trans>Switch Done!</Trans>);
            } catch (error) {
                if (error instanceof TokenExpiredError) {
                    const state = getProfileState(account.profile.profileSource);
                    state.removeAccount(account);

                    enqueueWarningMessage(<Trans>This account has expired, please log in again.</Trans>);
                    return;
                }

                enqueueMessageFromError(error, <Trans>Failed to switch.</Trans>);
                throw error;
            }
        },
        [identity.id, identity.source, isMyProfilePage, isPureProfilePage, updateParams],
    );

    return (
        <div className="rounded-[6px] px-6 pb-6 max-md:max-h-[calc(100vh_-_64px)] max-md:overflow-auto md:w-[400px]">
            <div
                className={classNames(
                    'no-scrollbar rounded-[6px] md:max-h-[492px]',
                    isOpenFireflyAccountMenu ? 'overflow-hidden' : 'overflow-auto',
                )}
            >
                {hideSocialLogin ? null : (
                    <>
                        {isLoginFirefly ? (
                            isLoading ? (
                                <FireflyAccountLoadingSkeleton />
                            ) : (
                                <FireflyAccount
                                    profile={data?.fireflyAccount ?? undefined}
                                    connections={data?.__origin__}
                                    onChangeMenuOpenStatus={setIsOpenFireflyAccountMenu}
                                />
                            )
                        ) : (
                            <FireflyLoginButton />
                        )}
                        <div className="my-2 text-left text-medium font-medium leading-[15px]">
                            <Trans>Social accounts</Trans>
                        </div>
                        <div className="flex flex-col gap-2">
                            {SORTED_LOGIN_SOCIAL_SOURCES.map((source, index) => {
                                return (
                                    <div
                                        className="overflow-hidden rounded-lg border border-secondaryLine"
                                        key={source}
                                    >
                                        <ClickableButton
                                            className={classNames(
                                                'flex w-full cursor-pointer items-center justify-between p-2',
                                                {
                                                    'bg-bg': !isLoginFirefly ? index % 2 === 0 : true,
                                                    'border-b border-secondaryLine':
                                                        isLoginFirefly && profileStore[source].accounts.length > 0,
                                                },
                                            )}
                                            disabled={switchLoading}
                                            onClick={() => onClick(source)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <ProfileSourceIcon source={source} size={20} />
                                                <span>{resolveSourceName(source)}</span>
                                            </div>
                                            <PlusIcon className="size-5" />
                                        </ClickableButton>
                                        {profileStore[source].accounts.map((account, index) => {
                                            const isCurrent = isSameProfile(profilesAll[source], account.profile);
                                            return (
                                                <div
                                                    className="flex min-w-0 items-center justify-between p-2"
                                                    key={index}
                                                >
                                                    <div className="mr-2 flex min-w-0 items-center gap-2">
                                                        <ProfileAvatar
                                                            profile={account.profile}
                                                            enableSourceIcon={false}
                                                            size={40}
                                                            enableDefaultAvatar
                                                        />
                                                        <div className="flex min-w-0 flex-col items-start text-[14px] leading-5">
                                                            <span className="max-w-full truncate font-bold">
                                                                {account.profile.displayName}
                                                            </span>
                                                            <span className="max-w-full truncate text-secondary">
                                                                @{account.profile.handle}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {isCurrent ? (
                                                        <CircleCheckboxIcon className="shrink-0" checked />
                                                    ) : (
                                                        <ClickableButton
                                                            className="size-5"
                                                            disabled={switchLoading}
                                                            loading={
                                                                switchLoading
                                                                    ? isSameAccount(selectedAccount, account)
                                                                    : false
                                                            }
                                                            onClick={() => {
                                                                setSelectedAccount(account);
                                                                onSwitchAccount(account);
                                                            }}
                                                        >
                                                            <SwitchIcon className="size-5" />
                                                        </ClickableButton>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="my-2 text-left text-medium font-medium leading-[15px]">
                            <Trans>Other accounts</Trans>
                        </div>
                    </>
                )}
                <div className="flex flex-col gap-2">
                    {SORTED_THIRD_PARTY_SOURCES_IN_URL.map((sourceInUrl, index) => {
                        const source = resolveSource(sourceInUrl) as ThirdPartySource | Source.Email;
                        const profile = data ? formatAccountFromConnections(sourceInUrl, data.__origin__) : null;
                        return (
                            <div className="overflow-hidden rounded-lg border border-secondaryLine" key={index}>
                                <ClickableButton
                                    className={classNames(
                                        'flex w-full cursor-pointer items-center justify-between p-2',
                                        {
                                            'bg-bg': !profile || (index % 2 === 0 && !isLoginFirefly),
                                        },
                                    )}
                                    onClick={() => {
                                        if (profile) return;
                                        if (source !== Source.Email) {
                                            onAuthClick(source);
                                            return;
                                        } else {
                                            history.replace(
                                                urlcat('/:source', {
                                                    source: resolveSourceInUrl(source),
                                                }),
                                            );
                                        }
                                    }}
                                >
                                    {profile ? (
                                        <div className="flex items-center gap-2">
                                            <ProfileSourceIcon source={source} size={20} />
                                            {formatThirdPartyProfileName(profile.profile)}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <ProfileSourceIcon source={source} size={20} />
                                                <span>{resolveSourceName(source)}</span>
                                            </div>
                                            {!loading && selectedSource !== source ? (
                                                <PlusIcon className="size-5" />
                                            ) : null}
                                        </>
                                    )}
                                </ClickableButton>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
