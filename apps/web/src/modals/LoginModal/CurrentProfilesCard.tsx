'use client';

import PlusIcon from '@dimensiondev/assets/plus.svg';
import SwitchIcon from '@dimensiondev/assets/switch.svg';
import { MAX_ACCOUNT_COUNT_PER_SOURCE } from '@dimensiondev/constants/static';
import type { SocialSource } from '@dimensiondev/enums';
import { PageRoute } from '@dimensiondev/enums';
import { classNames, delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { memo, useCallback, useState } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import { AvatarGroup } from '@/components/AvatarGroup.js';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { SessionExpiredError } from '@/constants/error.js';
import { usePathname } from '@/esm/navigation.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { isSameAccount } from '@/helpers/isSameAccount.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { openLoginModalWithGuard } from '@/helpers/openLoginModal.js';
import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { useUpdateParams } from '@/hooks/useUpdateParams.js';
import { captureProfileAccountClick } from '@/providers/telemetry/captureProfileAccountEvent.js';
import type { Account } from '@/providers/types/Account.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { switchAccount } from '@/services/account.js';
import { useFireflyIdentityState } from '@/store/useFireflyIdentityStore.js';

interface CurrentProfilesCardProps {
    source: SocialSource;
    accounts: Account[];
    connectedProfiles: Profile[];
    index: number;
    loading?: boolean;
}

export const CurrentProfilesCard = memo<CurrentProfilesCardProps>(function CurrentProfilesCard({
    source,
    accounts,
    connectedProfiles,
    index,
    loading = false,
}) {
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const isLoginFirefly = useIsLoginFirefly();
    const profileStore = useProfileStoreAll();
    const router = useRouter();
    const pathname = usePathname();
    const { identity } = useFireflyIdentityState();
    const isMyProfile = useIsMyRelatedProfile(identity.source, identity.id);

    const updateParams = useUpdateParams();

    const isPureProfilePage = pathname === PageRoute.Profile;
    const isMyProfilePage = isMyProfile && (isPureProfilePage || isRoutePathname(pathname, PageRoute.Profile));

    const [{ loading: switchLoading }, onSwitchAccount] = useAsyncFn(
        async (account: Account) => {
            try {
                const source = account.profile.source;

                if (!account.session) {
                    await delay(300);
                    openLoginModalWithGuard({
                        source,
                        options: { expectedProfile: account.profile.profileId },
                    });
                    return;
                }

                await switchAccount(account);
                captureProfileAccountClick(account.profile);

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
                if (error instanceof SessionExpiredError) return;

                enqueueMessageFromError(error, <Trans>Failed to switch.</Trans>);
                throw error;
            }
        },
        [identity.id, identity.source, isMyProfilePage, isPureProfilePage, updateParams],
    );

    const onClick = useCallback(
        (source: SocialSource) => {
            const path = urlcat('/:source', {
                source: resolveSourceInUrl(source),
            });

            // history.back() is buggy, use .replace() instead.
            router.history.replace(path);
        },
        [router.history],
    );

    const isExceed = accounts.length >= MAX_ACCOUNT_COUNT_PER_SOURCE;

    return (
        <div className="overflow-hidden rounded-lg border border-secondaryLine" key={source}>
            <ClickableButton
                className={classNames(
                    'flex w-full items-center justify-between p-2',
                    isExceed ? 'cursor-not-allowed' : 'cursor-pointer',
                    {
                        'bg-bg': !isLoginFirefly ? index % 2 === 0 : true,
                        'border-b border-secondaryLine': isLoginFirefly && profileStore[source].accounts.length > 0,
                    },
                )}
                disabled={switchLoading || loading}
                onClick={isExceed ? undefined : () => onClick(source)}
                aria-label={`Add ${resolveSourceName(source)} account`}
            >
                <div className="flex items-center gap-2">
                    <ProfileSourceIcon source={source} size={20} />
                    <span>{resolveSourceName(source)}</span>
                </div>
                <Tooltip
                    content={
                        loading ? (
                            <Trans>Trying auto login...</Trans>
                        ) : isExceed ? (
                            <Trans>Link up to three accounts</Trans>
                        ) : null
                    }
                >
                    {loading ? (
                        <LoadingIcon size={20} />
                    ) : (
                        <PlusIcon className={classNames('size-5', isExceed ? 'opacity-40' : '')} />
                    )}
                </Tooltip>
            </ClickableButton>
            {accounts.map((account, index) => {
                const isCurrent = isSameProfile(profileStore[source].currentProfile, account.profile);
                return (
                    <div className="flex min-w-0 items-center justify-between p-2" key={index}>
                        <div className="mr-2 flex min-w-0 items-center gap-2">
                            <ProfileAvatar
                                profile={account.profile}
                                enableSourceIcon={false}
                                size={40}
                                enableDefaultAvatar
                            />
                            <div className="flex min-w-0 flex-col items-start text-[14px] leading-5">
                                <span className="max-w-full truncate font-bold">{account.profile.displayName}</span>
                                <span className="max-w-full truncate text-secondary">@{account.profile.handle}</span>
                            </div>
                        </div>
                        {isCurrent ? (
                            <CircleCheckboxIcon className="shrink-0" checked />
                        ) : (
                            <ClickableButton
                                className="size-5"
                                disabled={switchLoading}
                                loading={switchLoading ? isSameAccount(selectedAccount, account) : false}
                                onClick={() => {
                                    setSelectedAccount(account);
                                    onSwitchAccount(account);
                                }}
                                aria-label={`Switch to ${account.profile.displayName || account.profile.handle}`}
                            >
                                <SwitchIcon className="size-5" />
                            </ClickableButton>
                        )}
                    </div>
                );
            })}
            {connectedProfiles.length > 0 ? (
                <ClickableArea
                    className="flex cursor-pointer items-center gap-[10px] border-t border-t-line p-2"
                    onClick={() => onClick(source)}
                >
                    <AvatarGroup profiles={connectedProfiles} AvatarProps={{ className: 'size-5', size: 20 }} />
                    <span className="text-sm font-normal text-second">
                        <Trans>Reauthorize connected account</Trans>
                    </span>
                </ClickableArea>
            ) : null}
        </div>
    );
});
