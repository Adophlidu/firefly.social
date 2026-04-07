import { type ChangeEvent, type FormEvent, type KeyboardEvent, useCallback, useMemo } from 'react';

interface UseDecimalInputOptions {
    value: string;
    onValueChange: (next: string) => void;
    maxDecimals?: number;
}

export function useDecimalInput({ value, onValueChange, maxDecimals = 2 }: UseDecimalInputOptions) {
    const regex = useMemo(() => new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}$`), [maxDecimals]);

    const normalizeFragment = useCallback((fragment: string) => {
        let out = '';
        for (const ch of fragment) {
            // ASCII digits
            if (ch >= '0' && ch <= '9') out += ch;
            // Full-width digits
            else if (ch >= '０' && ch <= '９') out += String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30);
            // Dot variants commonly produced under CJK IMEs/keyboards
            else if (ch === '.' || ch === '．' || ch === '。' || ch === '｡') out += '.';
        }

        return out;
    }, []);

    const isValid = useCallback((input: string) => input === '' || regex.test(input), [regex]);

    const sanitize = useCallback(
        (raw: string) => {
            let out = '';
            let hasDot = false;
            for (const ch of raw) {
                const normalized = normalizeFragment(ch);
                if (!normalized) continue;

                for (const c of normalized) {
                    if (c >= '0' && c <= '9') out += c;
                    else if (c === '.' && !hasDot) {
                        out += '.';
                        hasDot = true;
                    }
                }
            }

            if (!hasDot) return out;
            const [intPart, decPart = ''] = out.split('.');
            return `${intPart}.${decPart.slice(0, maxDecimals)}`;
        },
        [maxDecimals, normalizeFragment],
    );

    const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        // Prevent "e/E/+/-" scientific notation and negative signs.
        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
            e.preventDefault();
        }
    }, []);

    const onBeforeInput = useCallback(
        (e: FormEvent<HTMLInputElement>) => {
            // Only block alphabet letters (e.g. pinyin from Chinese IME). Non-numeric symbols will be sanitized on change.
            const nativeEvent = e.nativeEvent as unknown as InputEvent;
            const data = nativeEvent.data;
            if (!data) return;
            if (/^[A-Za-z]+$/.test(data)) {
                e.preventDefault();
                return;
            }

            const normalizedData = normalizeFragment(data);
            if (!normalizedData) return;

            const target = e.currentTarget;
            const start = target.selectionStart ?? target.value.length;
            const end = target.selectionEnd ?? target.value.length;
            // `value` is controlled and already sanitized, so use the normalized fragment for validity checks.
            const nextValue = `${target.value.slice(0, start)}${normalizedData}${target.value.slice(end)}`;
            if (!isValid(nextValue)) e.preventDefault();
        },
        [isValid, normalizeFragment],
    );

    const onChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            // Always accept changes; we sanitize aggressively so IME toggling never "locks" the input.
            const inputValue = sanitize(e.target.value);
            if (isValid(inputValue)) onValueChange(inputValue);
            else onValueChange(sanitize(inputValue));
        },
        [isValid, onValueChange, sanitize],
    );

    const inputProps = useMemo(
        () => ({
            value,
            type: 'text' as const,
            inputMode: 'decimal' as const,
            onKeyDown,
            onBeforeInput,
            onChange,
        }),
        [onBeforeInput, onChange, onKeyDown, value],
    );

    return { inputProps };
}
