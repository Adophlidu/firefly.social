'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo, useRef } from 'react';

import { ClearButton } from '@/components/IconButton.js';

interface SearchInputProps extends HTMLProps<HTMLInputElement> {
    onClear?: () => void;
    iconClassName?: string;
}

export const SearchInput = memo(function SearchInput({
    onClear,
    ref,
    placeholder,
    iconClassName,
    ...rest
}: SearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <label className="relative flex w-full flex-1 items-center">
            <input
                type="search"
                name="searchText"
                autoComplete="off"
                spellCheck="false"
                ref={inputRef}
                {...rest}
                className={classNames(
                    `placeholder:text-secondary dark:text-input w-full border-0 bg-transparent py-2 focus:border-0 focus:outline-0 focus:ring-0 sm:text-sm sm:leading-6`,
                    rest.className,
                )}
            />
            {!rest.value ? (
                <span className="text-secondary pointer-events-none absolute left-0 pl-3 sm:text-sm sm:leading-6">
                    {placeholder || <Trans>Search...</Trans>}
                </span>
            ) : null}
            {rest.value ? (
                <ClearButton
                    type="button"
                    IconProps={{ className: iconClassName ?? '!text-inherit' }}
                    size={16}
                    onClick={() => {
                        onClear?.();
                        inputRef.current?.focus();
                    }}
                />
            ) : null}
        </label>
    );
});
