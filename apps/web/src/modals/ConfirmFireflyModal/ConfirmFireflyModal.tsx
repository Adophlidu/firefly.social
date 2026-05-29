import { ACCOUNT_CONFLICT_SOLUTION_URL, ACCOUNT_CONFLICT_SOLUTION_ZH_URL } from '@dimensiondev/constants/static';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ProfileInList } from '@/components/Login/ProfileInList.js';
import { Link } from '@/esm/Link.js';
import { createDummyProfileFromFireflySession } from '@/helpers/createDummyProfile.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { closeConfirmModal, openConfirmModal } from '@/helpers/openConfirmModal.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useFireflyAccountAvatar } from '@/hooks/useFireflyAccountAvatar.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { ConfirmFireflyModalRef, type ConfirmFireflyModalRefType } from '@/modals/ConfirmFireflyModal/refs.js';
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

            openConfirmModal({
                title: <Trans>Different Account Detected</Trans>,
                content: (
                    <div>
                        <p className="mb-2 mt-[-8px] text-medium font-medium leading-normal text-second">
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
                            <menu className="no-scrollbar mb-2 flex max-h-[192px] flex-col gap-3 overflow-auto rounded-md border border-line p-2">
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
                                className="box-border flex h-10 flex-1 items-center justify-center rounded-full border border-main text-medium font-bold text-main"
                                onClick={() => {
                                    closeConfirmModal(false);
                                    ConfirmFireflyModalRef.close(false);
                                    captureAccountConflictNoEvent(account.fireflySession?.accountIdForEvent ?? '');
                                }}
                            >
                                <Trans>Cancel</Trans>
                            </ClickableButton>
                            <ClickableButton
                                className="box-border flex h-10 flex-1 items-center justify-center rounded-full bg-main text-medium font-bold text-primaryBottom"
                                onClick={() => {
                                    closeConfirmModal(true);
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
                    closeConfirmModal(false);
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
            <Link href={href} target="_blank" className="text-xs font-medium text-highlight underline">
                <Trans>How to do?</Trans>
            </Link>
        </div>
    );
}
