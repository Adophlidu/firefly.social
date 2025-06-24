import { Dialog } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { rootRouteId, useMatch } from '@tanstack/react-router';
import { type ReactNode } from 'react';

import LeftArrowIcon from '@/assets/left-arrow.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { router, TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { Tooltip } from '@/components/Tooltip.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';

interface TipsModalHeaderProps {
    title?: ReactNode;
    back?: boolean;
}

export function TipsModalHeader({ title, back = false }: TipsModalHeaderProps) {
    const { context } = useMatch({ from: rootRouteId });
    const isSmall = useIsSmall('max');

    return (
        <Dialog.Title as="h3" className="relative mb-6 flex shrink-0 justify-center text-center pt-safe">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-fourMain">
                {back ? (
                    <Tooltip placement="top" content={<Trans>Back</Trans>}>
                        <ClickableButton onClick={() => router.navigate({ to: TipsRoutePath.TIPS, replace: true })}>
                            <LeftArrowIcon width={24} height={24} />
                        </ClickableButton>
                    </Tooltip>
                ) : !isSmall ? (
                    <CloseButton onClick={context.onClose} />
                ) : null}
            </span>
            <span className="max-w-full truncate text-lg font-bold leading-[22px] sm:max-w-[calc(100%-70px)]">
                {title || <Trans>Tips</Trans>}
            </span>
        </Dialog.Title>
    );
}
