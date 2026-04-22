import RightAnswerIcon from '@dimensiondev/assets/right-answer.svg';
import { classNames } from '@dimensiondev/utils';
import { motion } from 'framer-motion';

import { removeTrailingZeros } from '@/helpers/removeTrailingZeros.js';
import type { PollOption } from '@/providers/types/Poll.js';

interface VoteResultProps {
    option: PollOption;
    totalVotes: number;
    maxPercent: number;
}

export function VoteResult({ option, totalVotes, maxPercent }: VoteResultProps) {
    const { label, votes = 0, percent } = option;
    const currentRate = percent ?? (totalVotes ? Number.parseFloat(((votes / totalVotes) * 100).toFixed(2)) : 0);

    const isUserVoted = option.isVoted ?? false;
    const isMaxPercent = !!currentRate && currentRate === maxPercent;

    return (
        <div className="relative mt-3 h-10">
            <div
                className="absolute h-full overflow-hidden rounded-[10px]"
                style={{ width: currentRate ? `${currentRate}%` : '20px' }}
            >
                <motion.div
                    className="dark:bg-secondaryMain h-full bg-[#EEEEF6]"
                    transition={{
                        type: 'tween',
                        ease: 'easeInOut',
                        duration: 0.5,
                        delay: 0.3,
                    }}
                    style={{ width: '0%' }}
                    animate={{ width: '100%' }}
                />
            </div>
            <div className="text-lightMain absolute z-10 flex size-full items-center justify-between pl-5 text-base font-bold">
                <span
                    className={classNames('mr-2 flex items-center gap-2 truncate', {
                        'text-highlight': isUserVoted,
                        'text-lightMain': !isUserVoted && isMaxPercent,
                        'text-second': !isUserVoted && !isMaxPercent,
                    })}
                >
                    <span className="overflow-hidden">{label}</span>
                    {isUserVoted ? <RightAnswerIcon className="mr-2 shrink-0" width={20} height={20} /> : null}
                </span>
                <span className={isMaxPercent ? 'text-lightMain' : 'text-third'}>
                    {removeTrailingZeros(currentRate.toFixed(2))}%
                </span>
            </div>
        </div>
    );
}
