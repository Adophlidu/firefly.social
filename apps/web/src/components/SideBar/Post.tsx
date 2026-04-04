'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import { Trans } from '@lingui/react/macro';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentVisitingChannel } from '@/hooks/useCurrentVisitingChannel.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useMounted } from '@/hooks/useMounted.js';

interface PostProps {
    collapsed?: boolean;
}

export function Post({ collapsed = false }: PostProps) {
    const mounted = useMounted();
    const isLogin = useIsLogin();
    const isSyncing = useAsyncStatusAll();
    const currentChannel = useCurrentVisitingChannel();

    if (!mounted) return null;

    return isLogin && !isSyncing ? (
        collapsed ? (
            <li className="text-center">
                <Tooltip content={<Trans>Post</Trans>} placement="right">
                    <ClickableButton
                        className="bg-main text-primaryBottom rounded-full p-1"
                        onClick={() =>
                            openComposeModal({
                                type: 'compose',
                                channel: currentChannel,
                            })
                        }
                    >
                        <PlusIcon className="size-5" aria-hidden="true" />
                    </ClickableButton>
                </Tooltip>
            </li>
        ) : (
            <li className="px-2">
                <ClickableButton
                    className="bg-main text-primaryBottom mt-6 hidden w-full rounded-2xl p-2 text-xl font-bold leading-6 md:block"
                    onClick={() => {
                        openComposeModal({
                            type: 'compose',
                            channel: currentChannel,
                        });
                    }}
                >
                    <Trans>Post</Trans>
                </ClickableButton>
            </li>
        )
    ) : null;
}
