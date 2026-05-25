import SuccessIcon from '@dimensiondev/assets/circle-success.svg';
import ErrorIcon from '@dimensiondev/assets/failed.svg';
import LoadingIcon from '@dimensiondev/assets/loading-dot.svg';
import { Toaster as Sonner } from 'sonner';

import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
    const isDarkMode = useIsDarkMode();
    const theme = isDarkMode ? 'dark' : 'light';

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            icons={{
                error: <ErrorIcon className="size-5 text-danger" width={20} height={20} />,
                success: <SuccessIcon className="size-5 text-success" width={20} height={20} />,
                loading: <LoadingIcon className="size-5 text-primary" width={20} height={20} />,
            }}
            position="top-center"
            toastOptions={{
                classNames: {
                    toast: 'group toast group-[.toaster]:bg-primaryBottom group-[.toaster]:text-foreground group-[.toaster]:shadow-popup3 text-sm',
                    description: 'group-[.toast]:text-second',
                    actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-second',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--foreground)',
                    '--normal-border': 'transparent',
                    '--border-radius': '12px',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
