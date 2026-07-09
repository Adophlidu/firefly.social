'use client';

import LikeIcon from '@dimensiondev/assets/like-large.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';

interface LikeButtonUIProps {
    isLiked: boolean;
    size?: number;
    tooltip?: boolean;
    disabled?: boolean;
    className?: string;
    likeCount?: number;
    onToggle?: (liked: boolean) => Promise<void>;
}
interface Particle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
}

export const LikeButtonUI = memo<LikeButtonUIProps>(function LikeButtonUI({
    size = 16,
    isLiked,
    tooltip = true,
    disabled = false,
    className,
    likeCount = 0,
    onToggle,
}) {
    const [particles, setParticles] = useState<Particle[]>([]);
    const buttonId = useRef(`like-button-${crypto.randomUUID()}`);
    const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (burstTimerRef.current !== null) clearTimeout(burstTimerRef.current);
        };
    }, []);

    const triggerBurst = useCallback(() => {
        const newParticles: Particle[] = Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 40 + Math.random() * 40;
            return {
                id: Date.now() + i,
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                rotation: Math.random() * 90 - 45,
                scale: 0.4 + Math.random() * 0.4,
            };
        });
        setParticles(newParticles);

        if (burstTimerRef.current !== null) clearTimeout(burstTimerRef.current);
        burstTimerRef.current = setTimeout(() => {
            burstTimerRef.current = null;
            setParticles([]);
        }, 1000);
    }, []);

    const [{ loading }, handleLike] = useAsyncFn(async () => {
        const nextState = !isLiked;
        await onToggle?.(nextState);
        if (nextState) {
            triggerBurst();
        }
    }, [isLiked, onToggle, triggerBurst]);

    const isDisabled = disabled || loading;

    const mainButton = (
        <motion.button
            whileTap={{ scale: 0.8 }}
            className={classNames(
                'group relative z-10 rounded-full transition-colors duration-300',
                isLiked ? 'text-danger' : 'text-second hover:text-danger',
                className,
            )}
            disabled={isDisabled}
            id={buttonId.current}
            onClick={() => {
                if (isDisabled) return;
                handleLike();
            }}
        >
            {loading ? (
                <LoadingIcon size={size} className="text-second" />
            ) : (
                <>
                    <motion.div
                        animate={
                            isLiked
                                ? {
                                      scale: [1, 1.4, 1],
                                      rotate: [0, 15, -15, 0],
                                  }
                                : { scale: 1 }
                        }
                        transition={{ duration: 0.4 }}
                        className="inline-flex size-7 items-center justify-center rounded-full group-hover:bg-danger/[.20]"
                    >
                        <LikeIcon fill={isLiked ? 'currentColor' : 'none'} width={size} height={size} />
                    </motion.div>
                    {likeCount > 0 ? <span className="-ml-1 text-xs font-bold">{nFormatter(likeCount)}</span> : null}
                </>
            )}
        </motion.button>
    );

    return (
        <div className="relative flex items-center justify-center">
            {/* Particles */}
            <AnimatePresence>
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                        animate={{
                            x: particle.x,
                            y: particle.y,
                            opacity: 0,
                            scale: particle.scale,
                            rotate: particle.rotation,
                        }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="pointer-events-none absolute text-danger"
                    >
                        <LikeIcon fill="currentColor" width={size / 1.5} height={size / 1.5} />
                    </motion.div>
                ))}
            </AnimatePresence>

            {tooltip ? (
                <Tooltip
                    content={isLiked ? <Trans id="action-unlike">Unlike</Trans> : <Trans id="action-like">Like</Trans>}
                    placement="top"
                    disabled={isDisabled}
                >
                    {mainButton}
                </Tooltip>
            ) : (
                mainButton
            )}
        </div>
    );
});
