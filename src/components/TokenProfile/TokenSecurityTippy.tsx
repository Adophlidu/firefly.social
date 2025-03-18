import { first, groupBy } from 'lodash-es';
import { type ReactElement } from 'react';

import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import { RiskCard } from '@/components/TokenProfile/RiskCard.js';
import { type AddressSecurity, SecurityMessageLevel, type TokenContractSecurity } from '@/providers/types/Security.js';

interface Props {
    level: SecurityMessageLevel | SecurityMessageLevel[];
    security: TokenContractSecurity | AddressSecurity;
    // eslint-disable-next-line @typescript-eslint/ban-types
    children: ReactElement<any>;
}

export function TokenSecurityTippy({ children, level, security }: Props) {
    const { message_list } = security;
    const levels = Array.isArray(level) ? level : [level];

    const matched = message_list?.filter((rule) => levels.includes(rule.level) && rule.condition(security));

    if (!matched?.length) return children;
    const theFirst = first(matched)!;
    const groups = groupBy(matched, 'level');

    const content =
        levels.length > 1 ? (
            <div className="rounded-lg border border-line bg-primaryBottom p-4">
                {Object.entries(groups).map(([level, group]) => {
                    return (
                        <RiskCard
                            key={level}
                            className="!p-0"
                            level={group[0].level}
                            security={security}
                            messages={group}
                        />
                    );
                })}
            </div>
        ) : (
            <RiskCard level={theFirst.level} security={security} messages={matched} />
        );

    return (
        <InteractiveTippy maxWidth={350} delay={300} className="tippy-card" placement="bottom" content={content}>
            {children}
        </InteractiveTippy>
    );
}
