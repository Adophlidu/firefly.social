'use client';

import NotificationIcon from '@dimensiondev/assets/notification.svg';
import { NOTIFICATION_PERMISSION_KEY } from '@dimensiondev/constants/static';
import { Trans } from '@lingui/react/macro';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { useSnackbar } from '@/components/Snackbar.js';

interface PermissionSnackbarProps {
    id: string;
    rejected: boolean;
    ref?: React.ForwardedRef<HTMLDivElement>;
    onEnable?: () => void;
}

export function PermissionSnackbar({ id, rejected, ref, onEnable }: PermissionSnackbarProps) {
    const { closeSnackbar } = useSnackbar();

    return (
        <div className="bg-lightBottom text-main shadow-popover dark:bg-darkBottom relative flex w-[343px] !items-start gap-2 rounded-2xl p-4 text-xs dark:shadow-none">
            <CloseButton
                size={18}
                className="absolute right-3 top-3"
                onClick={() => {
                    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, `${Infinity}`);
                    closeSnackbar(id);
                }}
            />
            <div className="text-second px-1 pt-4">
                <NotificationIcon width={24} height={24} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                    <Trans>Stay in the loop with Firefly!</Trans>
                </p>
                {!rejected ? (
                    <>
                        <p className="mt-2 text-sm">
                            <Trans>✨ Turn on browser notifications to never miss a trade update.</Trans>
                        </p>
                        <div className="mt-4 flex items-center gap-3 font-bold">
                            <ClickableButton
                                className="bg-main text-primaryBottom h-8 flex-1 rounded-full text-center leading-8"
                                onClick={() => {
                                    onEnable?.();
                                    closeSnackbar(id);
                                }}
                                aria-label="Enable notifications now"
                            >
                                <Trans>Enable now</Trans>
                            </ClickableButton>
                            <ClickableButton
                                className="bg-thirdMain h-8 flex-1 rounded-full text-center leading-8"
                                onClick={() => {
                                    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, Date.now().toString());
                                    closeSnackbar(id);
                                }}
                                aria-label="Remind me later"
                            >
                                <Trans>Remind me later</Trans>
                            </ClickableButton>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="mt-2 text-sm">
                            <Trans>👀 Firefly notifications are off. </Trans>
                        </p>
                        <p className="mt-2 text-sm">
                            <Trans>👉 To stay updated on trades, enable notifications in your browser settings.</Trans>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
