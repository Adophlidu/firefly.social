import { classNames } from '@dimensiondev/utils';
import { Fragment, type HTMLProps, memo } from 'react';

import DangerIcon from '@/assets/danger.svg';
import WarningIcon from '@/assets/warning.svg';
import {
    type AddressSecurity,
    type SecurityMessage,
    SecurityMessageLevel,
    type TokenContractSecurity,
} from '@/providers/types/Security.js';

interface RiskCardProps extends Omit<HTMLProps<HTMLDivElement>, 'security'> {
    level: SecurityMessageLevel;
    messages: Array<SecurityMessage<TokenContractSecurity | AddressSecurity>>;
    security: TokenContractSecurity | AddressSecurity;
}

export const RiskCard = memo<RiskCardProps>(function RiskCard({ level, messages, security, ...rest }) {
    const icon =
        level === SecurityMessageLevel.High ? (
            <DangerIcon width={16} height={16} className="shrink-0" />
        ) : level === SecurityMessageLevel.Medium ? (
            <WarningIcon width={16} height={16} className="shrink-0" />
        ) : null;

    const textColor = {
        'text-warn': level === SecurityMessageLevel.Medium,
        'text-danger': level === SecurityMessageLevel.High,
        'text-success': level === SecurityMessageLevel.Safe,
    };

    return (
        <div
            {...rest}
            className={classNames(
                'box-border flex w-[568px] cursor-pointer flex-row gap-3 rounded-lg border border-line bg-primaryBottom p-4 text-main',
                rest.className,
            )}
        >
            <div className={classNames('inline-flex items-center justify-center self-start', textColor)}>{icon}</div>
            <div className="flex flex-col gap-1">
                {messages.map((message) => {
                    const title = message.title(security);
                    const description = message.message(security);
                    return (
                        <Fragment key={title}>
                            <div className={classNames('font-bold', textColor)}>{title}</div>
                            {description ? <div className="text-sm text-secondary">{description}</div> : null}
                        </Fragment>
                    );
                })}
            </div>
        </div>
    );
});
