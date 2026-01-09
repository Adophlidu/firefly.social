import { motion } from 'framer-motion';
import { type PropsWithChildren } from 'react';

export function ShadowInAndOut({
    className,
    children,
}: PropsWithChildren<{
    className?: string;
}>) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                type: 'spring',
                damping: 15,
                stiffness: 100,
                mass: 0.5,
                duration: 0.3,
            }}
        >
            {children}
        </motion.div>
    );
}
