import MadeWithAIIcon from '@dimensiondev/assets/made-with-ai.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

interface MadeWithAITagProps {
    className?: string;
}

export const MadeWithAITag = memo(function MadeWithAITag({ className }: MadeWithAITagProps) {
    return (
        <div
            className={classNames(
                'mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-lightBg px-2 py-1 text-medium leading-4 text-secondary',
                className,
            )}
        >
            <MadeWithAIIcon width={14} height={14} className="shrink-0" />
            <span>
                <Trans>Made with AI</Trans>
            </span>
        </div>
    );
});
