import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ProfileInList } from '@/components/Login/ProfileInList.js';
import { Modal } from '@/components/Modal.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { captureTokenSyncNoEvent, captureTokenSyncYesEvent } from '@/providers/telemetry/captureSyncTokenEvent.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export interface ConfirmSyncSessionModalOpenProps {
    profiles: Profile[];
}

export type ConfirmSyncSessionModalCloseProps = boolean;

type Props = {
    ref: React.Ref<SingletonModalRefCreator<ConfirmSyncSessionModalOpenProps, ConfirmSyncSessionModalCloseProps>>;
};

export function ConfirmSyncSessionModal({ ref }: Props) {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: async ({ profiles }) => {
            setProfiles(profiles);
        },
    });

    return (
        <Modal
            open={open}
            disableBackdropClose
            onClose={() => {
                dispatch?.close(false);
            }}
        >
            <div
                className={
                    'relative flex w-[320px] max-w-[clamp(386px,90vw,95vw)] flex-col rounded-xl bg-bgModal shadow-popover transition-all dark:text-gray-950 md:w-[355px]'
                }
                onClick={stopPropagation}
            >
                <div className="inline-flex h-auto w-full items-center justify-center gap-4 rounded-t-[12px] p-4">
                    <div className="shrink grow basis-0 text-center text-lg font-bold leading-snug text-main">
                        <Trans>Accounts Connected</Trans>
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-6 px-6 pb-[6px] pt-0">
                    <div className="text-center text-medium leading-[18px] text-second">
                        <Trans>We&apos;ve detected logins available for sync.</Trans>
                    </div>
                </div>

                <menu className="no-scrollbar flex max-h-[156px] flex-col gap-[6px] overflow-auto px-6 pb-4 pt-2">
                    {profiles
                        .sort((a, b) => {
                            const aIndex = SORTED_SOCIAL_SOURCES.indexOf(a.source);
                            const bIndex = SORTED_SOCIAL_SOURCES.indexOf(b.source);
                            return aIndex - bIndex;
                        })
                        .map((profile) => (
                            <ProfileInList
                                key={profile.profileId}
                                selectable={false}
                                profile={profile}
                                profileAvatarProps={{
                                    enableSourceIcon: true,
                                }}
                            />
                        ))}
                </menu>

                <div className="flex gap-2 px-6 pb-6">
                    <ClickableButton
                        className="box-border flex h-10 flex-1 items-center justify-center rounded-full border border-main text-medium font-bold text-main"
                        onClick={() => {
                            captureTokenSyncNoEvent();
                            dispatch?.close(false);
                        }}
                    >
                        <Trans>Skip</Trans>
                    </ClickableButton>
                    <ClickableButton
                        className="box-border flex h-10 flex-1 items-center justify-center rounded-full bg-main text-medium font-bold text-primaryBottom"
                        onClick={() => {
                            captureTokenSyncYesEvent();
                            dispatch?.close(true);
                        }}
                    >
                        <Trans>Confirm</Trans>
                    </ClickableButton>
                </div>
            </div>
        </Modal>
    );
}

export const ConfirmSyncSessionModalRef = new SingletonModal<
    ConfirmSyncSessionModalOpenProps,
    ConfirmSyncSessionModalCloseProps
>();
