import { classNames } from '@firefly/utils';
import { type HTMLProps, memo } from 'react';

export const MenuButton = memo(function MenuButton(props: HTMLProps<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={props.type as 'button'}
            className={classNames(
                'flex h-8 items-center space-x-2 px-3 py-1',
                props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-bg',
                props.className,
            )}
            onClick={(event) => {
                if (props.disabled) return;
                props.onClick?.(event);
            }}
        />
    );
});
