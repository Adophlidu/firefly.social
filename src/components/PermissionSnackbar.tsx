import { Trans } from '@lingui/react/macro';
import { SnackbarContent, useSnackbar } from 'notistack';

import NotificationIcon from '@/assets/notification.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { NOTIFICATION_PERMISSION_KEY } from '@/constants/index.js';
import { setupFirebaseFcmConnection } from '@/services/setupFirebaseFcmConnection.js';

interface PermissionSnackbarProps {
    id: number | string;
    rejected: boolean;
    ref?: React.ForwardedRef<HTMLDivElement>;
}

export function PermissionSnackbar({ id, rejected, ref }: PermissionSnackbarProps) {
    const { closeSnackbar } = useSnackbar();

    return (
        <SnackbarContent ref={ref}>
            <div className="relative flex w-[343px] !items-start gap-2 rounded-2xl bg-lightBottom p-4 text-xs text-main shadow-popover dark:bg-darkBottom dark:shadow-none">
                <CloseButton size={18} className="absolute right-3 top-3" onClick={() => closeSnackbar(id)} />
                <div className="text-lightSecond px-1 pt-4">
                    <NotificationIcon width={24} height={24} />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-sm font-bold">
                        <Trans>Stay in the loop with Firefly!</Trans>
                    </h1>
                    {!rejected ? (
                        <>
                            <p className="mt-2 text-sm">
                                <Trans>✨ Turn on browser notifications to never miss a trade update.</Trans>
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">
                                    <Trans>👉 vitalik.eth</Trans>
                                </span>
                                <br />
                                <span className="pl-4">
                                    <Trans>Swapped 0.1 ETH for 253.97 Virtual.</Trans>
                                </span>
                            </p>
                            <div className="mt-4 flex items-center gap-3 font-bold">
                                <ClickableButton
                                    className="h-8 flex-1 rounded-full bg-main text-center leading-8 text-primaryBottom"
                                    onClick={() => {
                                        setupFirebaseFcmConnection({ showUi: false });
                                        closeSnackbar(id);
                                    }}
                                >
                                    <Trans>Enable now</Trans>
                                </ClickableButton>
                                <ClickableButton
                                    className="h-8 flex-1 rounded-full bg-thirdMain text-center leading-8"
                                    onClick={() => {
                                        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, Date.now().toString());
                                        closeSnackbar(id);
                                    }}
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
                                <Trans>
                                    👉 To stay updated on trades, enable notifications in your browser settings.
                                </Trans>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </SnackbarContent>
    );
}
