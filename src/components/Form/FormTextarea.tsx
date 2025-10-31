import { classNames } from '@firefly/utils';
import type { HTMLProps } from 'react';
import { type FieldPath, type FieldValues, type RegisterOptions, useFormContext, useFormState } from 'react-hook-form';

interface TextareaProps<
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends HTMLProps<HTMLTextAreaElement> {
    name: TFieldName;
    options?: RegisterOptions<TFieldValues, TFieldName>;
}

export function FormTextarea<
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, options, className, ...props }: TextareaProps<TFieldValues, TFieldName>) {
    const { register, control } = useFormContext<TFieldValues>();
    const { errors } = useFormState({ control });
    const error = errors[name];
    return (
        <textarea
            className={classNames(
                'w-full rounded-2xl border-none bg-bg text-main !outline-offset-0 ring-0 duration-100 focus:bg-transparent focus:outline-1',
                error ? 'focus:shadow-inputDanger focus:ring-fail/50' : 'focus:ring-highlight/50',
                className,
            )}
            autoComplete="off"
            spellCheck="false"
            {...props}
            {...register(name, options)}
        />
    );
}
