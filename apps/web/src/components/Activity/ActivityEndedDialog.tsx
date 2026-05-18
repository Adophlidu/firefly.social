'use client';

import { ActivityStatus, PageRoute } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { type ReactNode, useCallback } from 'react';

import { Modal } from '@/components/Modal.js';
import { useRouter } from '@/esm/navigation.js';
import type { ActivityInfoResponse } from '@/providers/types/Firefly.js';

interface Props {
    data: Pick<Required<ActivityInfoResponse>['data'], 'status'>;
    open?: boolean;
    buttonText?: ReactNode;
    onClose?: () => void;
}

export function ActivityEndedDialog({ buttonText, data, open = true, ...rest }: Props) {
    const router = useRouter();
    const onClose = useCallback(() => {
        router.replace(PageRoute.Events);
    }, [router]);

    return (
        <Modal open={!!open && data.status === ActivityStatus.Ended} onClose={onClose}>
            <div className="bg-primaryBottom relative w-[359px] rounded-[12px] transition-all">
                <div className="relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-t-[12px] pt-6 text-center">
                    <div className="text-main text-lg font-bold leading-6">
                        <Trans>Event Ended!</Trans>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-second mb-6 text-sm font-medium leading-6">
                        <Trans>This event has ended. Stay tuned for what&#39;s next!</Trans>
                    </p>
                    <button
                        className="flex h-12 w-full items-center justify-center rounded-full border border-current px-4 text-center text-base font-bold leading-8"
                        onClick={rest.onClose ?? onClose}
                    >
                        {buttonText ?? <Trans>Back to list</Trans>}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
