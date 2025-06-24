import { Trans } from '@lingui/react/macro';
import { type ReactNode } from 'react';

interface TimelineTitleProps {
    title: ReactNode;
}

export function TimelineTitle(props: TimelineTitleProps) {
    return (
        <div className="flex h-[60px] w-full items-center px-4 pt-2.5 max-md:hidden">
            <h1 className="text-[20px] font-bold leading-6">
                <Trans>{props.title}</Trans>
            </h1>
        </div>
    );
}
