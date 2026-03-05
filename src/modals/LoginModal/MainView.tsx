'use client';

import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { rootRouteId, useMatch, useRouter } from '@tanstack/react-router';
import { signIn } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import FireflyAvatar from '@/assets/firefly.round.svg';
import PlusIcon from '@/assets/plus.svg';
import ScanIcon from '@/assets/scan.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { SORTED_LOGIN_SOCIAL_SOURCES, SORTED_THIRD_PARTY_SOURCES_IN_URL } from '@/constants/computed.js';
import { Source, type ThirdPartySource } from '@/constants/enum.js';
import { MAX_ACCOUNT_COUNT_PER_SOURCE } from '@/constants/static.js';
import { formatAccountFromConnections } from '@/helpers/formatAccountFromConnections.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAllConnectionsFormattedWithProfiles } from '@/hooks/useAllConnectionsFormattedWithProfiles.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { CurrentProfilesCard } from '@/modals/LoginModal/CurrentProfilesCard.js';
import { FireflyAccount } from '@/modals/LoginModal/FireflyAccount.js';
import { LensCurrentProfilesCard } from '@/modals/LoginModal/LensCurrentProfilesCard.js';
import { type LoginModalOpenProps, LoginModalRef } from '@/modals/LoginModal/refs.js';
import { SignInWithFireflyAppModalRef } from '@/modals/SignInWithFireflyAppModal/refs.js';
import { getTelegramLoginUrl } from '@/providers/firefly/auth/getTelegramLoginUrl.js';
import { formatThirdPartyProfileName } from '@/providers/lens/formatThirdPartyProfileName.js';
import { captureMobileQrLoginClickEvent } from '@/providers/telemetry/captureSyncTokenEvent.js';

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

    const isLoginFirefly = useIsLoginFirefly();
    const profileStore = useProfileStoreAll();
    const { data: allConnections, connectionLoading, connections } = useAllConnectionsFormattedWithProfiles();

    const { context } = useMatch({ from: rootRouteId }) as {
        context: { props?: LoginModalOpenProps };
    };

    const hideSocialLogin = context?.props?.options?.hideSocialLogin;

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

    const accountList = useMemo(() => {
        return SORTED_LOGIN_SOCIAL_SOURCES.map((source) => {
            const socialConnections = allConnections?.socialConnections || [];
            const accounts = profileStore[source].accounts;
            const connectedProfiles = socialConnections
                .flatMap((x) => {
                    if (x.source !== source) return [];
                    return x.items.filter(({ connection }) => {
                        const isConnected =
                            ('connectedAt' in connection && connection.connectedAt) ||
                            ('connected' in connection && connection.connected);
                        return isConnected;
                    });
                })
                .filter((x) => !accounts.some((y) => isSameProfile(x.profile, y.profile)))
                .slice(0, MAX_ACCOUNT_COUNT_PER_SOURCE)
                .map((x) => x.profile);

            return {
                source,
                accounts,
                connectedProfiles,
            };
        });
    }, [profileStore, allConnections]);

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
                            connectionLoading ? (
                                <FireflyAccountLoadingSkeleton />
                            ) : (
                                <FireflyAccount
                                    profile={connections?.fireflyAccount ?? undefined}
                                    connections={connections?.__origin__}
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
                            {accountList.map(({ source, accounts, connectedProfiles }, index) => {
                                const props = { source, accounts, connectedProfiles, index };

                                return source === Source.Lens ? (
                                    <LensCurrentProfilesCard key={source} {...props} />
                                ) : (
                                    <CurrentProfilesCard key={source} {...props} />
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
                        const profile = connections
                            ? formatAccountFromConnections(sourceInUrl, connections.__origin__)
                            : null;
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
                                    aria-label={
                                        profile
                                            ? `${formatThirdPartyProfileName(profile.profile)} account`
                                            : `Add ${resolveSourceName(source)} account`
                                    }
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
