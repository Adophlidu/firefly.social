import ButtonBg from '@dimensiondev/assets/button-bg.svg';
import { classNames } from '@dimensiondev/utils';
import { motion } from 'framer-motion';

import type { ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';

interface SquareButtonProps extends ClickableButtonProps {
    colorMode?: 'light' | 'dark' | 'auto';
}

export function SquareButton({
    children,
    className,
    colorMode = 'auto',
    loading,
    disabled,
    onClick,
}: SquareButtonProps) {
    return (
        <motion.button
            className={classNames(
                'relative h-12 w-60',
                disabled || loading ? 'cursor-not-allowed opacity-50' : '',
                className,
            )}
            onClick={(e) => {
                if (disabled || loading) return;
                onClick?.(e);
            }}
            disabled={loading || disabled}
            whileTap={{ scale: 0.95 }}
        >
            <ButtonBg
                width={'100%'}
                height={'100%'}
                preserveAspectRatio="none"
                className={colorMode === 'auto' ? 'text-main' : colorMode === 'light' ? 'text-white' : 'text-[#171717]'}
            />
            <div className="z-1 absolute inset-0 flex items-center justify-center gap-3">
                {loading ? (
                    <LoadingIcon
                        size={24}
                        className={
                            colorMode === 'auto'
                                ? 'text-primaryBottom'
                                : colorMode === 'light'
                                  ? 'text-[#171717]'
                                  : 'text-white'
                        }
                    />
                ) : (
                    children
                )}
            </div>
        </motion.button>
    );
}
