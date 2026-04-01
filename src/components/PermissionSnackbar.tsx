'use client';

import { Trans } from '@lingui/react/macro';

import NotificationIcon from '@/assets/notification.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { useSnackbar } from '@/components/Snackbar.js';
import { NOTIFICATION_PERMISSION_KEY } from '@/constants/static.js';

interface PermissionSnackbarProps {
    id: string;
    rejected: boolean;
    ref?: React.ForwardedRef<HTMLDivElement>;
    onEnable?: () => void;
}

export function PermissionSnackbar({ id, rejected, ref, onEnable }: PermissionSnackbarProps) {
    const { closeSnackbar } = useSnackbar();

    return (
        <div className="relative flex w-[343px] !items-start gap-2 rounded-2xl bg-lightBottom p-4 text-xs text-main shadow-popover dark:bg-darkBottom dark:shadow-none">
            <CloseButton
                size={18}
                className="absolute right-3 top-3"
                onClick={() => {
                    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, `${Infinity}`);
                    closeSnackbar(id);
                }}
            />
            <div className="px-1 pt-4 text-second">
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
                                className="h-8 flex-1 rounded-full bg-main text-center leading-8 text-primaryBottom"
                                onClick={() => {
                                    onEnable?.();
                                    closeSnackbar(id);
                                }}
                                aria-label="Enable notifications now"
                            >
                                <Trans>Enable now</Trans>
                            </ClickableButton>
                            <ClickableButton
                                className="h-8 flex-1 rounded-full bg-thirdMain text-center leading-8"
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
