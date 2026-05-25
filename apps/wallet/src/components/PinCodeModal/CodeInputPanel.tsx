import { classNames } from '@dimensiondev/utils';
import { type ChangeEvent, memo, useCallback, useEffect, useRef, useState } from 'react';

import { PIN_CODE_INPUT_ID, PIN_CODE_LENGTH } from '@/constants/pinCode.js';

interface CodeInputPanelProps {
    code: string;
    codeLength?: number;
    readOnly?: boolean;
    onCodeChange: (code: string) => void;
    onConfirm?: () => void;
}

export const CodeInputPanel = memo<CodeInputPanelProps>(function CodeInputPanel({
    code,
    readOnly,
    codeLength = PIN_CODE_LENGTH,
    onCodeChange,
    onConfirm,
}) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const onInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            if (readOnly) return;

            const { value } = event.target;

            if (!value) {
                onCodeChange('');
                return;
            }

            const newCode = /^\d+$/.test(value) ? value : code;
            onCodeChange(newCode.slice(0, codeLength));
        },
        [code, onCodeChange, codeLength, readOnly],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (readOnly) return;

            const isNumberKey = /^[0-9]$/.test(event.key);
            if (isNumberKey && inputRef.current && !isFocused) {
                event.preventDefault();

                const currentValue = inputRef.current.value;
                const newValue = currentValue + event.key;

                if (newValue.length <= codeLength) {
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
    }, [isFocused, codeLength, readOnly, onInputChange]);

    return (
        <div className="relative flex items-center" style={{ justifyContent: 'space-around' }} ref={wrapperRef}>
            <input
                id={PIN_CODE_INPUT_ID}
                className="absolute -z-1 size-0 opacity-0"
                type="text"
                readOnly={readOnly}
                ref={inputRef}
                value={code}
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
                inputMode="decimal"
                onChange={onInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(event) => {
                    event.stopPropagation();
                }}
                onKeyUp={(event) => {
                    if (readOnly) return;
                    if (event.key === 'Enter') {
                        onConfirm?.();
                    }
                }}
            />
            {Array.from({ length: codeLength }, (_, index) => (
                <span
                    key={index}
                    onClick={() => {
                        if (readOnly) return;
                        if (!inputRef.current) return;

                        inputRef.current.focus();
                        inputRef.current.setSelectionRange(code.length, code.length);
                    }}
                    className={classNames(
                        'size-11 rounded-2xl border border-lightLineSecond bg-lightBg text-center text-base font-medium !leading-[44px] text-main',
                    )}
                >
                    {code[index] ? '*' : ''}
                </span>
            ))}
        </div>
    );
});
