import { type ChangeEvent, memo, useCallback, useEffect, useRef } from 'react';

import { METRICS_PASSWORD_LENGTH, SESSION_PASSWORD_INPUT_ID_PREFIX } from '@/constants/index.js';
import { isValidPassword } from '@/modals/PasswordModal/isValidPassword.js';

interface PasswordInputPanelProps {
    password: string[];
    onPasswordChange: (password: string[]) => void;
}

export const PasswordInputPanel = memo<PasswordInputPanelProps>(function PasswordInputPanel({
    password,
    onPasswordChange,
}) {
    const firstInputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const lastFocusedIndex = useRef<number>(-1);
    const hasFocused = useRef(false);

    const onInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>, index: number) => {
            const { value, selectionStart } = event.target;

            const newPassword = [...password];
            newPassword[index] = /^\d+$/.test(value) ? value.slice(0, 1) : '';
            onPasswordChange(newPassword);

            if (!value?.trim()) return;

            if (selectionStart === 1 && index < METRICS_PASSWORD_LENGTH - 1) {
                document.getElementById(`${SESSION_PASSWORD_INPUT_ID_PREFIX}${index + 1}`)?.focus();
            } else if (selectionStart === 0 && index > 0) {
                document.getElementById(`${SESSION_PASSWORD_INPUT_ID_PREFIX}${index - 1}`)?.focus();
            }
        },
        [password, onPasswordChange],
    );

    useEffect(() => {
        if (firstInputRef.current && !hasFocused.current) {
            firstInputRef.current.focus();
            hasFocused.current = true;
        }
    }, []);

    useEffect(() => {
        if (isValidPassword(password)) {
            // blur the last focused input
            const lastFocusedInput = wrapperRef.current?.querySelectorAll('input')[lastFocusedIndex.current];
            lastFocusedInput?.blur();
        }
    }, [password]);

    return (
        <div className="flex items-center" style={{ justifyContent: 'space-around' }} ref={wrapperRef}>
            {Array.from({ length: METRICS_PASSWORD_LENGTH }, (_, index) => (
                <input
                    id={`${SESSION_PASSWORD_INPUT_ID_PREFIX}${index}`}
                    key={index}
                    ref={index === 0 ? firstInputRef : null}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    type="password"
                    className="h-11 w-11 rounded-2xl border border-lightLineSecond bg-input text-center text-base font-medium text-main outline-none placeholder:text-transparent focus:border-highlight"
                    maxLength={1}
                    value={password[index]}
                    onChange={(e) => onInputChange(e, index)}
                    onFocus={() => {
                        lastFocusedIndex.current = index;
                    }}
                />
            ))}
        </div>
    );
});
