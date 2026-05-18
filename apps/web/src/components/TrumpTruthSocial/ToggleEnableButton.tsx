'use client';

import SmallCloseIcon from '@dimensiondev/assets/small-close.svg';
import { ExploreSwitchType } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useLayoutEffect, useRef } from 'react';
import { useAsyncFn } from 'react-use';
import { useHover } from 'usehooks-ts';

import { ClickableButton } from '@/components/ClickableButton.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { Link } from '@/esm/Link.js';
import { useRouter } from '@/esm/navigation.js';
import { useExploreDataSwitchConfig } from '@/hooks/useExploreDataSwitchConfig.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';

interface ToggleEnableButtonProps {
    className?: string;
    isActive: boolean;
    replaceUrl?: string;
    link: string;
    inProfile?: boolean;
}

export const ToggleEnableButton = memo<ToggleEnableButtonProps>(function ToggleEnableButton({
    className,
    isActive,
    replaceUrl,
    inProfile,
    link,
}) {
    const { status, toggleSwitch } = useExploreDataSwitchConfig(ExploreSwitchType.TruthSocial, true);
    const router = useRouter();

    const spanRef = useRef<HTMLSpanElement>(null!);
    const isHover = useHover(spanRef);

    const [{ loading }, handleClick] = useAsyncFn(async () => {
        const confirmed = await ConfirmModalRef.openAndWaitForClose({
            title: <Trans>Remove Truth Social</Trans>,
            variant: 'normal',
            content: (
                <div className="text-main">
                    <Trans>
                        You can turn it back on anytime in{' '}
                        <Link className="text-highlight" href={'/settings/preference'}>
                            Settings &gt; Content preference
                        </Link>
                    </Trans>
                </div>
            ),
        });
        if (!confirmed) return;

        if (isActive && replaceUrl) {
            router.replace(replaceUrl);
        }

        await toggleSwitch(false);
    }, [isActive, replaceUrl, router, toggleSwitch]);

    useLayoutEffect(() => {
        if (isActive && spanRef.current) {
            spanRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isActive]);

    if (!status) return null;

    return (
        <span className="relative" ref={spanRef}>
            <SourceTab
                className={classNames(
                    'relative block whitespace-nowrap text-base md:!h-[45px] md:!py-2.5',
                    className,
                    inProfile ? '!px-3 font-extrabold' : 'md:!px-4',
                )}
                href={link}
                isActive={isActive}
            >
                <Trans>Truth Social</Trans>
            </SourceTab>
            {isActive || isHover ? (
                <ClickableButton className="absolute -right-1 top-0 size-[18px]" onClick={handleClick}>
                    <SmallCloseIcon width={18} height={18} className="text-highlight" />
                </ClickableButton>
            ) : null}
        </span>
    );
});
