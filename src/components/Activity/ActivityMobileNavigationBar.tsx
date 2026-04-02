'use client';

import NavigationBarBackIcon from '@dimensiondev/assets/navigation-bar-back.svg';
import ShareIcon from '@dimensiondev/assets/share-navbar.svg';
import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';
import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, useContext } from 'react';

import { ActivityContext } from '@/components/Activity/ActivityContext.js';
import { useActivityShareUrl } from '@/components/Activity/hooks/useActivityShareUrl.js';
import { IS_ANDROID } from '@/constants/browser.js';
import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { useComeBack } from '@/hooks/useComeback.js';
import { captureActivityEvent } from '@/providers/telemetry/captureActivityEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

interface Props extends HTMLProps<'div'> {}

export function ActivityMobileNavigationBar({ children, className }: Props) {
    const pathname = usePathname();
    const comeback = useComeBack();
    const { name } = useContext(ActivityContext);
    const shareUrl = useActivityShareUrl(name);
    const routeChanged = useGlobalState.use.routeChanged();

    return (
        <>
            <div
                className={classNames('fixed bottom-[calc(100%-44px)] left-0 z-20 h-[700px] w-full bg-primaryBottom', {
                    'dark:bg-[#181a20]': IS_ANDROID,
                })}
            />
            <div
                className={classNames('sticky top-0 z-30 w-full overflow-x-hidden bg-primaryBottom pt-safe', {
                    'dark:bg-[#181a20]': IS_ANDROID,
                })}
            >
                <div
                    className={classNames(
                        'grid h-[44px] w-full grid-cols-[24px_1fr_24px] items-center justify-between gap-2 bg-primaryBottom px-4 text-center text-lg font-bold',
                        className,
                        {
                            'dark:bg-[#181a20]': IS_ANDROID,
                        },
                    )}
                >
                    <div
                        className={classNames('absolute bottom-full left-0 h-[500px] w-full bg-primaryBottom', {
                            'dark:bg-[#181a20]': IS_ANDROID,
                        })}
                    />
                    <button
                        className="size-6 cursor-pointer"
                        onClick={() => {
                            if (pathname !== PageRoute.Events && routeChanged) {
                                comeback();
                                return;
                            }
                            if (nativeBridgeProvider.supported) nativeBridgeProvider.request(SupportedMethod.BACK, {});
                            else comeback();
                        }}
                    >
                        <NavigationBarBackIcon width={24} height={24} />
                    </button>
                    <p className="w-full min-w-0 truncate">{children}</p>
                    <button
                        className="size-6 cursor-pointer"
                        onClick={() => {
                            captureActivityEvent(EventId.EVENT_SHARE_CLICK, {});
                            if (pathname === PageRoute.Events) {
                                nativeBridgeProvider.request(SupportedMethod.SHARE, { text: location.href });
                                return;
                            }
                            nativeBridgeProvider.request(SupportedMethod.SHARE, { text: shareUrl });
                        }}
                    >
                        <ShareIcon width={24} height={24} />
                    </button>
                    <div className="absolute bottom-full h-[200px] w-full bg-primaryBottom dark:bg-[#262a34]" />
                </div>
            </div>
        </>
    );
}
