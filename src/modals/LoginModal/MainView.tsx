import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { delay, safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { usePathname } from 'next/navigation.js';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import PlusIcon from '@/assets/plus.svg';
import SwitchIcon from '@/assets/switch.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { FarcasterSignType, PageRoute, type SocialSource, Source, type ThirdPartySource } from '@/constants/enum.js';
import { SORTED_LOGIN_SOCIAL_SOURCES, SORTED_THIRD_PARTY_SOURCES_IN_URL } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { formatAccountFromConnections } from '@/helpers/formatAccountFromConnections.js';
import { formatThirdPartyProfileName } from '@/helpers/formatThirdPartyProfileName.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useAccountByNetwork } from '@/hooks/useAccountByNetwork.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { useUpdateParams } from '@/hooks/useUpdateParams.js';
import { ConnectModalRef, LoginModalRef } from '@/modals/controls.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { Account } from '@/providers/types/Account.js';
import { switchAccount } from '@/services/account.js';
import { useFireflyIdentityState } from '@/store/useFireflyIdentityStore.js';
import { useThirdPartyStateStore } from '@/store/useProfileStore.js';

export function MainView() {
    const account = useAccountByNetwork();
    const router = useRouter();
    const { history } = router;
    const isMedium = useIsMedium();
    const [selectedSource, setSelectedSource] = useState<ThirdPartySource>();

    const isLoginFirefly = useIsLoginFirefly();
    const profileStore = useProfileStoreAll();
    const profilesAll = useCurrentProfilesAll();
    const thirdPartyProfile = useThirdPartyStateStore.use.accounts();

    const pathname = usePathname();
    const updateParams = useUpdateParams();
    const { identity } = useFireflyIdentityState();

    const isMyProfile = useIsMyRelatedProfile(identity.source, identity.id);

    const isPureProfilePage = pathname === PageRoute.Profile;
    const isMyProfilePage = isMyProfile && (isPureProfilePage || isRoutePathname(pathname, PageRoute.Profile));

    const onClick = (source: SocialSource) => {
        const signType = source === Source.Farcaster && isMedium ? FarcasterSignType.RelayService : undefined;
        if (source === Source.Lens && !account.isConnected) {
            ConnectModalRef.open();
            return;
        }
        const path = urlcat('/:source', {
            source: resolveSourceInUrl(source),
            signType,
        });

        // history.back() is buggy, use .replace() instead.
        history.replace(path);
    };

    const [{ loading }, onAuthClick] = useAsyncFn(async (source: ThirdPartySource) => {
        try {
            setSelectedSource(source);
            switch (source) {
                case Source.Telegram:
                    const url = await FireflyEndpointProvider.getTelegramLoginUrl();
                    if (!url) return;
                    window.location.href = url;
                    break;
                case Source.Apple:
                case Source.Google:
                    await signIn(resolveSourceInUrl(source));
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
                    LoginModalRef.open({
                        source,
                        options: { expectedProfile: account.profile.profileId },
                    });
                    return;
                }
                await switchAccount({ ...account, session: account.session });
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

                enqueueSuccessMessage(t`Switch Done!`);
            } catch (error) {
                enqueueMessageFromError(error, t`Failed to switch.`);
                throw error;
            }
        },
        [identity.id, identity.source, isMyProfilePage, isPureProfilePage, updateParams],
    );

    const { data } = useQuery({
        queryKey: ['allConnections', [...thirdPartyProfile.map((x) => x.profile.profileId)]],
        queryFn: () => {
            return runInSafeAsync(() => FireflyEndpointProvider.getAllConnections());
        },
    });

    return (
        <div className="rounded-[6px] bg-primaryBottom px-6 pb-6 max-md:max-h-[calc(100vh-64px)] max-md:overflow-auto md:w-[400px]">
            <div className="mb-3 text-left text-[15px] font-medium leading-[15px]">
                <Trans>Social accounts</Trans>
            </div>
            <div className="flex flex-col gap-2">
                {SORTED_LOGIN_SOCIAL_SOURCES.map((source, index) => {
                    return (
                        <div className="overflow-hidden rounded-lg border border-secondaryLine" key={source}>
                            <ClickableButton
                                className={classNames('flex w-full cursor-pointer items-center justify-between p-2', {
                                    'bg-bg': !isLoginFirefly ? index % 2 === 0 : true,
                                    'border-b border-secondaryLine':
                                        isLoginFirefly && profileStore[source].accounts.length > 0,
                                })}
                                onClick={() => onClick(source)}
                            >
                                <div className="flex items-center gap-2">
                                    <ProfileSourceIcon source={source} size={20} />
                                    <span>{resolveSourceName(source)}</span>
                                </div>
                                {[Source.Bsky, Source.Twitter].includes(source) && !!profilesAll[source] ? (
                                    <SwitchIcon className="h-5 w-5" />
                                ) : (
                                    <PlusIcon className="h-5 w-5" />
                                )}
                            </ClickableButton>
                            {profileStore[source].accounts.map((account, index) => {
                                const isCurrent = isSameProfile(profilesAll[source], account.profile);
                                return (
                                    <div className="flex items-center justify-between p-2" key={index}>
                                        <div className="flex items-center gap-2">
                                            <ProfileAvatar
                                                profile={account.profile}
                                                enableSourceIcon={false}
                                                size={40}
                                            />
                                            <div className="flex flex-col items-start text-[14px] leading-5">
                                                <span className="font-bold">{account.profile.displayName}</span>
                                                <span className="text-secondary">@{account.profile.handle}</span>
                                            </div>
                                        </div>
                                        {isCurrent ? (
                                            <CircleCheckboxIcon className="text-lightHighlight" checked />
                                        ) : (
                                            <SwitchIcon
                                                className="h-5 w-5 cursor-pointer"
                                                onClick={() => {
                                                    if (switchLoading) return;
                                                    onSwitchAccount(account);
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            <div className="my-2 text-left text-[15px] font-medium leading-[15px]">
                <Trans>Other accounts</Trans>
            </div>
            <div className="flex flex-col gap-2">
                {SORTED_THIRD_PARTY_SOURCES_IN_URL.map((sourceInUrl, index) => {
                    const source = resolveSource(sourceInUrl) as ThirdPartySource | Source.Email;
                    const profile = data ? formatAccountFromConnections(sourceInUrl, data) : null;
                    return (
                        <div className="overflow-hidden rounded-lg border border-secondaryLine" key={index}>
                            <ClickableButton
                                className={classNames('flex w-full cursor-pointer items-center justify-between p-2', {
                                    'bg-bg': !profile || (index % 2 === 0 && !isLoginFirefly),
                                })}
                                onClick={() => {
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
                                            <PlusIcon className="h-5 w-5" />
                                        ) : null}
                                    </>
                                )}
                            </ClickableButton>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
