'use client';

import CheckIcon from '@dimensiondev/assets/check.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo, type ReactNode } from 'react';

import { captureTypeFilterClickEvent } from '@/providers/telemetry/captureFilterTabEvent.js';

export interface TypeFilterOption<T extends string> {
    value: T;
    label: string | ReactNode;
    icon?: ReactNode;
    /** When true, show a Sign in control instead of the checkbox; the row does not toggle the filter. */
    signInAction?: boolean;
    onSignIn?: (event: React.MouseEvent) => void;
}

interface BaseProps<T extends string> extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
    multiple?: boolean;
    /** Section title above the list (defaults to “Type filter”). */
    title?: ReactNode;
    options?: TypeFilterOption<T>[];
}

interface SingleOptionProps<T extends string = string> extends BaseProps<T> {
    selectedOption?: T | null;
    onOptionChange?: (option: T) => void;
}

interface MultipleOptionProps<T extends string = string> extends BaseProps<T> {
    selectedOptions?: T[];
    onOptionsChange?: (options: T[], newValue: T) => void;
}

function TypeFilter<T extends string = string>(props: SingleOptionProps<T>): ReactNode;
function TypeFilter<T extends string = string>(props: MultipleOptionProps<T>): ReactNode;
function TypeFilter<T extends string = string>({
    multiple,
    title,
    selectedOption,
    onOptionChange,
    selectedOptions = EMPTY_LIST,
    onOptionsChange,
    options = EMPTY_LIST,
    className,
    ...props
}: SingleOptionProps<T> & MultipleOptionProps<T>) {
    const showIconColumn = options.some((o) => o.icon);

    return (
        <div className={classNames('flex flex-col gap-4', className)} {...props}>
            <div className="text-main text-sm font-bold">{title ?? <Trans>Type filter</Trans>}</div>
            <div className="flex flex-col gap-3">
                {options.map((option) => {
                    const selected = multiple
                        ? selectedOptions.includes(option.value)
                        : selectedOption === option.value;
                    const inactive = option.signInAction || !selected;
                    const labelClass = inactive ? 'text-second text-sm font-normal' : 'text-main text-sm font-semibold';

                    return (
                        <div
                            key={option.value}
                            className={classNames(
                                'flex min-h-[22px] items-center gap-3',
                                option.signInAction ? 'cursor-default' : 'cursor-pointer',
                            )}
                            onClick={() => {
                                if (option.signInAction) return;
                                let newOptions: T[] = [];
                                if (multiple) {
                                    newOptions = selected
                                        ? selectedOptions.filter((x) => x !== option.value)
                                        : [...selectedOptions, option.value];
                                    onOptionsChange?.(newOptions, option.value);
                                } else {
                                    onOptionChange?.(option.value);
                                }
                                if (!selected) {
                                    captureTypeFilterClickEvent(option.value);
                                } else if (multiple && !newOptions.length) {
                                    captureTypeFilterClickEvent('all');
                                }
                            }}
                        >
                            {showIconColumn ? (
                                <span
                                    className={classNames(
                                        'flex size-5 shrink-0 items-center justify-center [&_svg]:size-5',
                                        option.icon ? (inactive ? 'text-second' : 'text-main') : 'text-transparent',
                                    )}
                                >
                                    {option.icon}
                                </span>
                            ) : null}
                            <div className={classNames('min-w-0 flex-1', labelClass)}>{option.label}</div>
                            {option.signInAction ? (
                                <button
                                    type="button"
                                    className="text-highlight shrink-0 text-sm font-normal"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        option.onSignIn?.(event);
                                    }}
                                >
                                    <Trans>Sign in</Trans>
                                </button>
                            ) : (
                                <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden>
                                    {selected ? (
                                        <span className="bg-highlight flex size-5 items-center justify-center rounded-full">
                                            <CheckIcon className="size-2.5 text-white" width={10} height={10} />
                                        </span>
                                    ) : (
                                        <span className="border-secondaryLine size-5 rounded-full border border-solid bg-transparent" />
                                    )}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const memoed: typeof TypeFilter = memo<SingleOptionProps & MultipleOptionProps>(TypeFilter);

export { memoed as TypeFilter };
