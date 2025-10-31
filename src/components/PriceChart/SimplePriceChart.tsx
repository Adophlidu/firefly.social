import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, memo } from 'react';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

import { useIsPriceUp } from '@/hooks/useIsPriceUp.js';
import type { PriceRecord } from '@/types/token.js';

interface SimplePriceChartProps extends HTMLProps<HTMLDivElement> {
    records: PriceRecord[];
}

const YAxisDomain = ['auto', 'auto'];
export const SimplePriceChart = memo<SimplePriceChartProps>(function SimplePriceChart({ records, ...rest }) {
    const isUp = useIsPriceUp(records);
    const stroke = isUp ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))';
    return (
        <div {...rest} className={classNames('relative overflow-visible', rest.className)}>
            <ResponsiveContainer>
                <LineChart data={records}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={stroke}
                        strokeWidth={2}
                        dot={false}
                        animationDuration={100}
                    />
                    <YAxis domain={YAxisDomain} hide />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
});
