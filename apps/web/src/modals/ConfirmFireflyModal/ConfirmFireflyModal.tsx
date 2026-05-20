import { ACCOUNT_CONFLICT_SOLUTION_URL, ACCOUNT_CONFLICT_SOLUTION_ZH_URL } from '@dimensiondev/constants/static';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ProfileInList } from '@/components/Login/ProfileInList.js';
import { Link } from '@/esm/Link.js';
import { createDummyProfileFromFireflySession } from '@/helpers/createDummyProfile.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useFireflyAccountAvatar } from '@/hooks/useFireflyAccountAvatar.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { ConfirmFireflyModalRef, type ConfirmFireflyModalRefType } from '@/modals/ConfirmFireflyModal/refs.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import {
    captureAccountConflictNoEvent,
    captureAccountConflictYesEvent,
} from '@/providers/telemetry/captureSyncTokenEvent.js';

interface Props {
    ref: React.Ref<ConfirmFireflyModalRefType>;
}

export function ConfirmFireflyModal({ ref }: Props) {
    const avatar = useFireflyAccountAvatar();
    useSingletonModal(ref, {
        onOpen: async ({ account }) => {
            const fireflyProfile = account.fireflySession
                ? createDummyProfileFromFireflySession(account.fireflySession)
                : null;

            ConfirmModalRef.open({
                title: <Trans>Different Account Detected</Trans>,
                content: (
                    <div>
                        <p className="text-medium text-second mb-2 mt-[-8px] font-medium leading-normal">
                            <Trans>
                                You are logging into a different Firefly account by{' '}
                                {resolveSourceName(account.profile.profileSource)} account{' '}
                                <Link className="text-highlight" href={getProfileUrl(account.profile)} target="_blank">
                                    @{account.profile.handle}
                                </Link>
                                . Continuing will <span className="text-danger">log out</span> your current Firefly
                                account.
                            </Trans>
                        </p>
                        {fireflyProfile ? (
                            <menu className="no-scrollbar border-line mb-2 flex max-h-[192px] flex-col gap-3 overflow-auto rounded-md border p-2">
                                <ProfileInList
                                    key={account.profile.profileId}
                                    selectable={false}
                                    viewable
                                    profile={fireflyProfile}
                                    viewProfile={account.profile}
                                    profileAvatarProps={{
                                        enableSourceIcon: false,
                                        fallbackUrl: avatar,
                                    }}
                                />
                            </menu>
                        ) : null}
                        <AccountConflictSolutionLink />
                        <div className="mt-6 flex gap-2">
                            <ClickableButton
                                className="border-main text-medium text-main box-border flex h-10 flex-1 items-center justify-center rounded-full border font-bold"
                                onClick={() => {
                                    ConfirmModalRef.close(false);
                                    ConfirmFireflyModalRef.close(false);
                                    captureAccountConflictNoEvent(account.fireflySession?.accountIdForEvent ?? '');
                                }}
                            >
                                <Trans>Cancel</Trans>
                            </ClickableButton>
                            <ClickableButton
                                className="bg-main text-medium text-primaryBottom box-border flex h-10 flex-1 items-center justify-center rounded-full font-bold"
                                onClick={() => {
                                    ConfirmModalRef.close(true);
                                    ConfirmFireflyModalRef.close(true);
                                    captureAccountConflictYesEvent(account.fireflySession?.accountIdForEvent ?? '');
                                }}
                            >
                                <Trans>Continue</Trans>
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
}

function AccountConflictSolutionLink() {
    const {
        i18n: { locale },
    } = useLingui();
    const href = useMemo(() => {
        if (locale === 'zh-Hans' || locale === 'zh-Hant') {
            return ACCOUNT_CONFLICT_SOLUTION_ZH_URL;
        }
        return ACCOUNT_CONFLICT_SOLUTION_URL;
    }, [locale]);
    return (
        <div className="flex w-full items-center justify-end">
            <Link href={href} target="_blank" className="text-highlight text-xs font-medium underline">
                <Trans>How to do?</Trans>
            </Link>
        </div>
    );
}
