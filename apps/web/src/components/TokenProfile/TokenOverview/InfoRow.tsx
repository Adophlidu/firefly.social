import QuestionIcon from '@dimensiondev/assets/question.svg';
import { classNames } from '@dimensiondev/utils';
import { isNumber } from 'lodash-es';
import { type HTMLProps, type ReactNode } from 'react';

import { Tooltip } from '@/components/Tooltip.js';
import { formatPrice } from '@/helpers/formatPrice.js';

function renderZero(value?: string) {
    return !value || value.replace('$', '') === '0' ? '-' : value;
}

interface InfoRowProps extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
    title: ReactNode;
    description?: ReactNode;
    value?: string | number;
    amount?: string | number;
    asInfinite?: boolean;
    extra?: ReactNode;
}

export function InfoRow({ title, description, amount, asInfinite, value, extra, className, ...rest }: InfoRowProps) {
    return (
        <div className={classNames('text-medium flex items-center gap-2', className)} {...rest}>
            <span className="text-second whitespace-nowrap">{title}</span>
            {description ? (
                <Tooltip placement="top" content={description} touch>
                    <QuestionIcon className="text-second ml-1 cursor-pointer" width={14} height={14} />
                </Tooltip>
            ) : null}
            {extra ? (
                <div className="ml-auto min-w-0">{extra}</div>
            ) : (
                <div
                    className={classNames(
                        'font-inter text-main ml-auto min-w-0 truncate whitespace-nowrap font-bold',
                        asInfinite ? 'text-2xl leading-[22.5px]' : 'text-medium',
                    )}
                >
                    {asInfinite
                        ? '∞'
                        : isNumber(value)
                          ? renderZero(`$${formatPrice(+value)}`)
                          : renderZero(formatPrice(amount) ?? '-')}
                </div>
            )}
        </div>
    );
}
