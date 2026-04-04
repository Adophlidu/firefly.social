import ArrowDownIcon from '@dimensiondev/assets/arrow-down.svg';
import { classNames } from '@dimensiondev/utils';
import { Popover, Transition } from '@headlessui/react';
import { Fragment, useMemo, useRef } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';

interface NumberSelectorProps {
    value: number;
    label: string;
    numbers:
        | number[]
        | {
              min: number;
              max: number;
          };
    className?: string;
    disabled?: boolean;
    onChange: (value: number) => void;
}

export function NumberSelector({ value, label, numbers, onChange, className, disabled = false }: NumberSelectorProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const options = useMemo(
        () =>
            Array.isArray(numbers)
                ? numbers
                : Array.from({ length: numbers.max - numbers.min + 1 }, (_, i) => i + numbers.min),
        [numbers],
    );

    return (
        <Popover as="div" className={classNames('relative', className)}>
            {({ open, close }) => {
                if (open && panelRef.current) {
                    const selectedEl = panelRef.current.children[value - options[0]];
                    selectedEl?.scrollIntoView({ block: 'center' });
                }
                return (
                    <>
                        <Popover.Button
                            disabled={disabled}
                            className={classNames(
                                'bg-lightBg w-full rounded-md border border-transparent px-2 py-1.5 md:rounded-2xl md:px-3 md:py-2.5',
                                disabled ? 'opacity-50' : '',
                                open ? 'border-lightSecond' : '',
                            )}
                        >
                            <div className="text-second text-left text-[13px]">{label}</div>
                            <div className="mt-1 flex items-center justify-between">
                                <span className="text-lightMain text-base font-bold md:text-lg">{value}</span>
                                <ArrowDownIcon className={classNames('text-second', open ? 'rotate-180' : '')} />
                            </div>
                        </Popover.Button>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0 translate-y-1"
                        >
                            <Popover.Panel
                                className="bg-lightBottom text-medium shadow-popover dark:border-line dark:bg-darkBottom absolute bottom-full right-0 flex max-h-[200px] w-full -translate-y-2 flex-col gap-2 overflow-y-auto rounded-lg py-3 md:max-h-[300px] dark:border dark:shadow-none"
                                ref={panelRef}
                            >
                                {options.map((option) => (
                                    <ClickableButton
                                        key={option}
                                        className={classNames(
                                            'text-lightMain h-6 cursor-pointer text-center text-base font-bold leading-6',
                                            value === option ? 'bg-lightBg' : '',
                                        )}
                                        onClick={() => {
                                            onChange(option);
                                            close();
                                        }}
                                        aria-label={`Select ${label} ${option}`}
                                    >
                                        {option}
                                    </ClickableButton>
                                ))}
                            </Popover.Panel>
                        </Transition>
                    </>
                );
            }}
        </Popover>
    );
}
