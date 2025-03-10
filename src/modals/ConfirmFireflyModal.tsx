import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { forwardRef } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { ProfileInList } from '@/components/Login/ProfileInList.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { ConfirmFireflyModalRef, ConfirmModalRef } from '@/modals/controls.js';
import type { Account } from '@/providers/types/Account.js';

export interface ConfirmFireflyModalOpenProps {
    account: Account;
}

export type ConfirmFireflyModalCloseProps = boolean;

export const ConfirmFireflyModal = forwardRef<
    SingletonModalRefCreator<ConfirmFireflyModalOpenProps, ConfirmFireflyModalCloseProps>
>(function ConfirmFireflyModal(_, ref) {
    useSingletonModal(ref, {
        onOpen: async (props) => {
            const { account } = props;

            ConfirmModalRef.open({
                title: t`Different Account Detected`,
                content: (
                    <div>
                        <p className="mb-2 mt-[-8px] text-medium font-medium leading-normal text-second">
                            <Trans>
                                You are logging into a different Firefly account by{' '}
                                {resolveSourceName(account.profile.source)} account{' '}
                                <Link
                                    href={resolveProfileUrl(account.profile.source, account.profile.profileId)}
                                    target="_blank"
                                >
                                    @{account.profile.handle}
                                </Link>
                                . Continuing will <span className="text-danger">log out</span> your current Firefly
                                account.
                            </Trans>
                        </p>
                        <menu className="no-scrollbar mb-6 flex max-h-[192px] flex-col gap-3 overflow-auto rounded-md border border-highlight border-line p-2">
                            <ProfileInList
                                key={account.profile.profileId}
                                selected
                                selectable={false}
                                viewable
                                profile={account.profile}
                                profileAvatarProps={{
                                    enableSourceIcon: true,
                                }}
                            />
                        </menu>
                        <div className="flex gap-2">
                            <ClickableButton
                                className="box-border flex h-10 flex-1 items-center justify-center rounded-full border border-main text-medium font-bold text-main"
                                onClick={() => {
                                    ConfirmModalRef.close(false);
                                    ConfirmFireflyModalRef.close(false);
                                }}
                            >
                                <Trans>Skip</Trans>
                            </ClickableButton>
                            <ClickableButton
                                className="box-border flex h-10 flex-1 items-center justify-center rounded-full bg-main text-medium font-bold text-primaryBottom"
                                onClick={() => {
                                    ConfirmModalRef.close(true);
                                    ConfirmFireflyModalRef.close(true);
                                }}
                            >
                                <Trans>Overwrite</Trans>
                            </ClickableButton>
                        </div>
                    </div>
                ),
                onCancel: () => {
                    ConfirmModalRef.close(false);
                    ConfirmFireflyModalRef.close(false);
                },
                enableCancelButton: false,
                enableConfirmButton: false,
                enableCloseButton: false,
            });
        },
    });

    return null;
});
