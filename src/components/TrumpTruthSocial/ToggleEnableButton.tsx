'use client';

import { Trans } from '@lingui/react/macro';
import { memo, useLayoutEffect, useRef } from 'react';
import { useHover } from 'usehooks-ts';

import SmallCloseIcon from '@/assets/small-close.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { useRouter } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { useToggleEnableTruthSocial } from '@/hooks/useToggleEnableTruthSocial.js';

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
    const { mutation, enable } = useToggleEnableTruthSocial(true);
    const router = useRouter();

    const spanRef = useRef<HTMLSpanElement>(null!);
    const isHover = useHover(spanRef);

    const handleClick = () => {
        if (isActive && replaceUrl) {
            router.replace(replaceUrl);
        }

        mutation.mutate();
    };

    useLayoutEffect(() => {
        if (isActive && spanRef.current) {
            spanRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isActive]);

    if (!enable) return null;

    return (
        <span className="relative" ref={spanRef}>
            <SourceTab
                className={classNames(
                    'relative block whitespace-nowrap text-base md:!h-[45px] md:!py-[10px]',
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
