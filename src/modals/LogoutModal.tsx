'use client';

import { classNames, delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';

import { ProfileInList } from '@/components/Login/ProfileInList.js';
import { PageRoute } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { useRouter } from '@/esm/navigation.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import type { Account } from '@/providers/types/Account.js';
import { removeAllAccounts, removeCurrentAccount } from '@/services/account.js';

interface LogoutModalProps {
    account?: Account;
}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<LogoutModalProps | void>>;
};

export function LogoutModal({ ref }: Props) {
    const router = useRouter();

    const [open, dispatch] = useSingletonModal(ref, {
        async onOpen(props) {
            const accounts = compact(
                props?.account ? [props.account] : SORTED_SOCIAL_SOURCES.flatMap((x) => getProfileState(x).accounts),
            );

            const confirmed = await ConfirmModalRef.openAndWaitForClose({
                title: <Trans>Log out</Trans>,
                contentClass: 'px-0 !pt-0',
                confirmButtonClass: 'mx-6',
                content: (
                    <div className="flex flex-col gap-2">
                        <div className="px-6 text-medium font-medium leading-normal text-lightMain">
                            {props?.account ? (
                                <Trans>Confirm to log out this account?</Trans>
                            ) : (
                                <Trans>Confirm to log out your Firefly account?</Trans>
                            )}
                        </div>
                        {props?.account ? (
                            <menu
                                className={classNames(
                                    'flex max-h-[192px] flex-col gap-3 overflow-auto px-6 pt-2',
                                    accounts.length <= 1 ? 'pb-2' : 'pb-6',
                                )}
                            >
                                {accounts.map((account) => (
                                    <div
                                        className="rounded-lg px-3 py-2 shadow-primary"
                                        key={account.profile.profileId}
                                    >
                                        <ProfileInList
                                            key={account.profile.profileId}
                                            selected
                                            selectable={false}
                                            profile={account.profile}
                                            profileAvatarProps={{
                                                enableSourceIcon: true,
                                            }}
                                        />
                                    </div>
                                ))}
                            </menu>
                        ) : null}
                    </div>
                ),
            });
            if (!confirmed) return;

            const source = props?.account?.profile.source;

            if (source) {
                await removeCurrentAccount(source);
            } else {
                await removeAllAccounts();
            }

            router.replace(PageRoute.Signup, {
                disableSameURL: true,
                showProgress: false,
            });
            await delay(200);

            dispatch?.close();
        },
    });

    return null;
}

export const LogoutModalRef = new SingletonModal<LogoutModalProps | void>();
