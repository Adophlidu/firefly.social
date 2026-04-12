import { classNames } from '@dimensiondev/utils';
import type { HTMLProps } from 'react';
import { type FieldPath, type FieldValues, type RegisterOptions, useFormContext, useFormState } from 'react-hook-form';

function inputClassName({
    error,
    className,
}: {
    error?: boolean;
    className?: string;
} = {}) {
    return classNames(
        'leading-12 bg-bg text-main h-12 w-full rounded-2xl border-none !outline-offset-0 ring-0 duration-100 focus:bg-transparent focus:outline-1',
        error ? 'focus:shadow-inputDanger focus:ring-fail/50' : 'focus:ring-highlight/50',
        className,
    );
}

interface InputProps<
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends HTMLProps<HTMLInputElement> {
    name: TFieldName;
    options?: RegisterOptions<TFieldValues, TFieldName>;
}

export function FormInput<
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, options, className, ...props }: InputProps<TFieldValues, TFieldName>) {
    const { register, control } = useFormContext<TFieldValues>();
    const { errors } = useFormState({ control });
    const error = errors[name];
    return (
        <input
            className={inputClassName({ error: !!error, className })}
            autoComplete="off"
            spellCheck="false"
            {...props}
            {...register(name, options)}
        />
    );
}
