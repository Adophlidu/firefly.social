import { type ChangeEvent, memo, useCallback, useEffect, useRef } from 'react';

import { METRICS_PASSWORD_LENGTH, SESSION_PASSWORD_INPUT_ID } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';

interface PasswordInputPanelProps {
    password: string;
    onPasswordChange: (password: string) => void;
}

export const PasswordInputPanel = memo<PasswordInputPanelProps>(function PasswordInputPanel({
    password,
    onPasswordChange,
}) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
        inputRef.current?.focus();
    }, []);

    return (
        <div className="relative flex items-center" style={{ justifyContent: 'space-around' }} ref={wrapperRef}>
            <input
                id={SESSION_PASSWORD_INPUT_ID}
                className="absolute -z-1 size-0 opacity-0"
                type="password"
                ref={inputRef}
                value={password}
                onChange={onInputChange}
            />
            {Array.from({ length: METRICS_PASSWORD_LENGTH }, (_, index) => (
                <span
                    onClick={() => {
                        if (!inputRef.current) return;

                        inputRef.current.focus();
                        inputRef.current.setSelectionRange(password.length, password.length);
                    }}
                    className={classNames(
                        'h-11 w-11 rounded-2xl border border-lightLineSecond bg-input text-center text-base font-medium !leading-[44px] text-main dark:bg-lightBg',
                    )}
                >
                    {password[index] ? '*' : ''}
                </span>
            ))}
        </div>
    );
});
