'use client';

import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, type ReactNode } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';

interface OptionButtonProps extends Omit<HTMLProps<HTMLButtonElement>, 'label'> {
    label: ReactNode;
    darkMode?: boolean;
    selected: boolean;
}

export function OptionButton({ darkMode = false, selected, label, onClick, ...props }: OptionButtonProps) {
    return (
        <ClickableButton
            className={classNames(
                `inline-flex h-[60px] w-[250px] items-center justify-center gap-5 rounded-lg px-3`,
                darkMode
                    ? 'border border-line bg-darkBottom text-white'
                    : 'border border-neutral-900 bg-white text-slate-950',
                props.className,
            )}
            onClick={onClick}
        >
            <div className="flex w-[135px] items-center gap-5">
                {selected ? (
                    <div
                        className="size-2 rounded-full bg-success"
                        style={{ filter: 'drop-shadow(0px 4px 10px var(--color-success))' }}
                    />
                ) : (
                    <div className="size-2" />
                )}
                <div className="flex-1 text-left text-medium font-bold leading-[18px]">{label}</div>
            </div>
        </ClickableButton>
    );
}
