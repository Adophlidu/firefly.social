import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

interface EmptyProps {
    keyword: string;
    message?: React.ReactNode;
}

export function Empty({ keyword, message }: EmptyProps) {
    return (
        <div className="mx-16">
            <div className="text-sm text-main">{t`No results for "${keyword}"`}</div>
            <p className="mt-4 text-center text-sm text-second">
                {message || <Trans>Try searching for something else.</Trans>}
            </p>
        </div>
    );
}
