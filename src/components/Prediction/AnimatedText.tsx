import { AnimatePresence, motion } from 'framer-motion';
import { memo, useMemo } from 'react';

interface AnimatedTextProps {
    text: string;
    config?: {
        duration?: number;
        stagger?: number;
    };
    className?: string;
}

export const AnimatedText = memo<AnimatedTextProps>(function AnimatedText({
    text,
    config = { duration: 0.3, stagger: 0.03 },
    className = '',
}) {
    // Split text into words to allow staggered animations and ensure robust wrapping
    const words = useMemo(
        () =>
            text
                .split(/\s+/)
                .filter(Boolean)
                .map((word, i) => ({
                    id: `${word}-${i}-${text.length}`,
                    content: word,
                })),
        [text],
    );

    return (
        <div className={`relative ${className}`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={text}
                    className="flex flex-wrap items-center justify-center gap-x-[0.3em] gap-y-[0.1em]"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                        staggerChildren: config.stagger,
                        delayChildren: 0.05,
                    }}
                >
                    {words.map((word, index) => (
                        <motion.span
                            key={`${word.id}-${index}`}
                            className="relative inline-block py-1"
                            variants={{
                                initial: { opacity: 0, filter: 'blur(0px)' },
                                animate: { opacity: 1, filter: 'blur(0px)' },
                                exit: { opacity: 0, filter: 'blur(0px)' },
                            }}
                            transition={{
                                duration: config.duration,
                                ease: [0.23, 1, 0.32, 1], // Custom quintic ease-out for smoother feel
                            }}
                        >
                            {word.content}
                        </motion.span>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
});
