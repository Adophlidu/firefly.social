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
    const deletePressTimer = useRef<NodeJS.Timeout | null>(null);
    const hasFocused = useRef(false);

    const onInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>, index: number) => {
            const { value, selectionStart } = event.target;

            const newPassword = [...password];
            newPassword[index] = /^\d+$/.test(value) ? value.slice(0, 1) : '';
            onPasswordChange(newPassword);

            if (!newPassword[index]?.trim()) return;

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
            document.getElementById(`${SESSION_PASSWORD_INPUT_ID_PREFIX}${METRICS_PASSWORD_LENGTH - 1}`)?.blur();
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
                    className="h-11 w-11 rounded-2xl border border-lightLineSecond bg-input text-center text-base font-medium text-main outline-none placeholder:text-transparent focus:border-highlight dark:bg-lightBg"
                    maxLength={1}
                    value={password[index]}
                    onChange={(e) => onInputChange(e, index)}
                    onKeyDown={(e) => {
                        if ((e.key === 'Backspace' || e.key === 'Delete') && index > 0) {
                            if (deletePressTimer.current) {
                                return;
                            }
                            deletePressTimer.current = setTimeout(() => {
                                const newPassword = [...password].map((p, i) => (i <= index ? '' : p));
                                onPasswordChange(newPassword);
                                document.getElementById(`${SESSION_PASSWORD_INPUT_ID_PREFIX}0`)?.focus();
                                deletePressTimer.current = null;
                            }, 700);
                        }
                    }}
                    onKeyUp={() => {
                        if (deletePressTimer.current) {
                            clearTimeout(deletePressTimer.current);
                            deletePressTimer.current = null;
                        }
                    }}
                    onPaste={(e) => {
                        if (index !== 0) return; // Only allow pasting in the first input

                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text').slice(0, METRICS_PASSWORD_LENGTH);
                        if (!/^\d+$/.test(pastedData)) return;

                        const newPassword = Array.from({ length: METRICS_PASSWORD_LENGTH }, (_, i) => {
                            return pastedData[i] || '';
                        });
                        onPasswordChange(newPassword);

                        const lastIndex = pastedData.length;
                        if (lastIndex > 0 && lastIndex < METRICS_PASSWORD_LENGTH) {
                            document.getElementById(`${SESSION_PASSWORD_INPUT_ID_PREFIX}${lastIndex}`)?.focus();
                        }
                    }}
                />
            ))}
        </div>
    );
});
