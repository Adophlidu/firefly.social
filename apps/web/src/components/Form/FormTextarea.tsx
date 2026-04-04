import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, type ReactNode } from 'react';
import {
    type FieldPath,
    type FieldValues,
    type RegisterOptions,
    useFormContext,
    useFormState,
    useWatch,
} from 'react-hook-form';

interface TextareaProps<
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<HTMLProps<HTMLTextAreaElement>, 'placeholder'> {
    name: TFieldName;
    placeholder?: ReactNode;
    options?: RegisterOptions<TFieldValues, TFieldName>;
}

export function FormTextarea<
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, options, className, placeholder, ...props }: TextareaProps<TFieldValues, TFieldName>) {
    const { register, control } = useFormContext<TFieldValues>();
    const { errors } = useFormState({ control });
    const value = useWatch<TFieldValues>({ control, name });
    const error = errors[name];
    return (
        <div className="w-full">
            <textarea
                className={classNames(
                    'bg-bg text-main w-full rounded-2xl border-none !outline-offset-0 ring-0 duration-100 focus:bg-transparent focus:outline-1',
                    error ? 'focus:shadow-inputDanger focus:ring-fail/50' : 'focus:ring-highlight/50',
                    className,
                )}
                autoComplete="off"
                spellCheck="false"
                {...props}
                {...register(name, options)}
            />
            {placeholder && !value ? (
                <span className="text-secondary pointer-events-none absolute left-0 pl-3 pt-2">{placeholder}</span>
            ) : null}
        </div>
    );
}
