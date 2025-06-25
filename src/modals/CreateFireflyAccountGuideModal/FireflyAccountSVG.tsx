import { motion } from 'framer-motion';

import FarcasterLogo from '@/assets/farcaster-logo.svg';
import FireflyAccountBg from '@/assets/firefly-account-bg.svg';
import LensLogo from '@/assets/lens-logo.svg';
import MessageLogo from '@/assets/message-logo.svg';
import TwitterLogo from '@/assets/x-logo.svg';
import { classNames } from '@/helpers/classNames.js';

interface FireflyAccountSVGProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FireflyAccountSVG({ className }: FireflyAccountSVGProps) {
    return (
        <div className={classNames('relative h-[350px] w-[286px]', className)}>
            <FireflyAccountBg />
            <motion.div
                className="absolute left-[145px] top-0"
                animate={{
                    y: [0, -15, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                    times: [0, 0.6, 1],
                }}
            >
                <FarcasterLogo />
            </motion.div>

            <motion.div
                className="absolute left-[214px] top-[125px]"
                animate={{
                    y: [0, -12, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                    times: [0, 0.5, 1],
                }}
            >
                <LensLogo />
            </motion.div>

            <motion.div
                className="absolute left-0 top-[87px]"
                animate={{
                    y: [0, -15, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                    times: [0, 0.4, 1],
                }}
            >
                <TwitterLogo />
            </motion.div>

            <motion.div
                className="absolute left-[58px] top-[170px]"
                animate={{
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                    times: [0, 0.5, 1],
                }}
            >
                <MessageLogo />
            </motion.div>
        </div>
    );
}
