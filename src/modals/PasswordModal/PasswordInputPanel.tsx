import { type ChangeEvent, memo, useCallback, useEffect, useRef, useState } from 'react';

import { METRICS_PASSWORD_LENGTH, SESSION_PASSWORD_INPUT_ID } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';

interface PasswordInputPanelProps {
    password: string;
    onPasswordChange: (password: string) => void;
    onConfirm: () => void;
}

export const PasswordInputPanel = memo<PasswordInputPanelProps>(function PasswordInputPanel({
    password,
    onPasswordChange,
    onConfirm,
}) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const onInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const { value } = event.target;

            if (!value) {
                onPasswordChange('');
                return;
            }

            const newPassword = /^\d+$/.test(value) ? value : password;
            onPasswordChange(newPassword.slice(0, METRICS_PASSWORD_LENGTH));
        },
        [password, onPasswordChange],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const isNumberKey = /^[0-9]$/.test(event.key);
            if (isNumberKey && inputRef.current && !isFocused) {
                event.preventDefault();

                const currentValue = inputRef.current.value;
                const newValue = currentValue + event.key;

                if (newValue.length <= METRICS_PASSWORD_LENGTH) {
                    inputRef.current.value = newValue;
                    onInputChange({ target: { value: newValue } } as ChangeEvent<HTMLInputElement>);
                }

                inputRef.current.focus();
            }

            if (event.key === 'Backspace' && inputRef.current && !isFocused) {
                event.preventDefault();

                const currentValue = inputRef.current.value;
                const newValue = currentValue.slice(0, -1);

                inputRef.current.value = newValue;
                onInputChange({ target: { value: newValue } } as ChangeEvent<HTMLInputElement>);

                inputRef.current.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFocused, onInputChange]);

    return (
        <div className="relative flex items-center" style={{ justifyContent: 'space-around' }} ref={wrapperRef}>
            <input
                id={SESSION_PASSWORD_INPUT_ID}
                className="absolute -z-1 size-0 opacity-0"
                type="password"
                ref={inputRef}
                value={password}
                autoCorrect="off"
                spellCheck="false"
                inputMode="decimal"
                onChange={onInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(event) => {
                    event.stopPropagation();
                }}
                onKeyUp={(event) => {
                    if (event.key === 'Enter') {
                        onConfirm();
                    }
                }}
            />
            {Array.from({ length: METRICS_PASSWORD_LENGTH }, (_, index) => (
                <span
                    key={index}
                    onClick={() => {
                        if (!inputRef.current) return;

                        inputRef.current.focus();
                        inputRef.current.setSelectionRange(password.length, password.length);
                    }}
                    className={classNames(
                        'size-11 rounded-2xl border border-lightLineSecond bg-input text-center text-base font-medium !leading-[44px] text-main dark:bg-lightBg',
                    )}
                >
                    {password[index] ? '*' : ''}
                </span>
            ))}
        </div>
    );
});
