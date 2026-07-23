import StarFilledIcon from '@dimensiondev/assets/star-filled.svg';
import StarOutlineIcon from '@dimensiondev/assets/star-outline.svg';
import { classNames } from '@dimensiondev/utils';
import { type ButtonHTMLAttributes, memo } from 'react';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children' | 'type'> {
    favorite: boolean;
    label: string;
}

export const PerpsFavoriteButton = memo(function PerpsFavoriteButton({ favorite, label, className, ...rest }: Props) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={favorite}
            className={classNames(
                'flex shrink-0 items-center justify-center outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#4c4aa9] disabled:cursor-wait disabled:opacity-60',
                favorite ? 'text-[#ffb100]' : 'text-[#b1b1b1]',
                className,
            )}
            {...rest}
        >
            {favorite ? <StarFilledIcon className="size-full" /> : <StarOutlineIcon className="size-full" />}
        </button>
    );
});
