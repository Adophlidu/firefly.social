import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo, type ReactNode } from 'react';

import { classNames } from '@/helpers/classNames.js';
import { captureTypeFilterClickEvent } from '@/providers/telemetry/captureFilterTabEvent.js';

interface BaseProps<T extends string> extends HTMLProps<HTMLDivElement> {
    multiple?: boolean;
    options?: Array<{ value: T; label: string | ReactNode }>;
}

interface SingleOptionProps<T extends string = string> extends BaseProps<T> {
    selectedOption?: T | null;
    onOptionChange?: (option: T) => void;
}

interface MultipleOptionProps<T extends string = string> extends BaseProps<T> {
    selectedOptions?: T[];
    onOptionsChange?: (options: T[]) => void;
}

function TypeFilter<T extends string = string>(props: SingleOptionProps<T>): ReactNode;
function TypeFilter<T extends string = string>(props: MultipleOptionProps<T>): ReactNode;
function TypeFilter<T extends string = string>({
    multiple,
    selectedOption,
    onOptionChange,
    selectedOptions = [],
    onOptionsChange,
    options = [],
    className,
    ...props
}: SingleOptionProps<T> & MultipleOptionProps<T>) {
    return (
        <div className={classNames('flex flex-col gap-3', className)} {...props}>
            <div className="text-sm font-normal text-second">
                <Trans>Type filter</Trans>
            </div>
            <div className="flex flex-col gap-2">
                {options.map((option) => {
                    const selected = multiple
                        ? selectedOptions.includes(option.value)
                        : selectedOption === option.value;
                    return (
                        <div
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2"
                            onClick={() => {
                                if (multiple) {
                                    onOptionsChange?.(
                                        selected
                                            ? selectedOptions.filter((x) => x !== option.value)
                                            : [...selectedOptions, option.value],
                                    );
                                } else {
                                    onOptionChange?.(option.value);
                                }
                                if (!selected) captureTypeFilterClickEvent(option.value);
                            }}
                        >
                            <input
                                type={multiple ? 'checkbox' : 'radio'}
                                checked={selected}
                                className={classNames('size-4 border-secondaryLine', multiple ? 'rounded-[4px]' : null)}
                            />
                            <div className="text-sm font-semibold text-main">{option.label}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const memoed: typeof TypeFilter = memo<SingleOptionProps & MultipleOptionProps>(TypeFilter);

export { memoed as TypeFilter };
