import { first, groupBy } from 'lodash-es';
import { type ReactElement } from 'react';

import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import { RiskCard } from '@/components/TokenProfile/RiskCard.js';
import {
    type AddressSecurity,
    type SecurityMessageLevel,
    type TokenContractSecurity,
} from '@/providers/types/Security.js';

interface Props {
    level: SecurityMessageLevel | SecurityMessageLevel[];
    security: TokenContractSecurity | AddressSecurity;
    children: ReactElement<any>;
    interactive?: boolean;
}

export function TokenSecurityTippy({ children, level, security, interactive }: Props) {
    const { message_list } = security;
    const levels = Array.isArray(level) ? level : [level];

    const matched = message_list?.filter((rule) => levels.includes(rule.level) && rule.condition(security));

    if (!matched?.length) return children;
    const theFirst = first(matched)!;
    const groups = groupBy(matched, 'level');

    const content =
        levels.length > 1 ? (
            <div className="flex flex-col gap-2 rounded-lg border border-line bg-primaryBottom p-4">
                {Object.entries(groups).map(([level, group]) => {
                    return <RiskCard key={level} level={group[0].level} security={security} messages={group} />;
                })}
            </div>
        ) : (
            <RiskCard level={theFirst.level} security={security} messages={matched} />
        );

    return (
        <InteractiveTippy
            maxWidth={350}
            delay={300}
            className="tippy-card !max-w-none"
            placement="bottom"
            content={content}
            interactive={interactive}
        >
            {children}
        </InteractiveTippy>
    );
}
