import BskyLogo from '@dimensiondev/assets/bsky-circle-logo.svg';
import FarcasterLogo from '@dimensiondev/assets/farcaster-logo.svg';
import FireflyAccountBg from '@dimensiondev/assets/firefly-account-bg.svg';
import LensLogo from '@dimensiondev/assets/lens-logo.svg';
import MessageLogo from '@dimensiondev/assets/message-logo.svg';
import TwitterLogo from '@dimensiondev/assets/x-logo.svg';
import { classNames } from '@dimensiondev/utils';
import { motion } from 'framer-motion';

interface FireflyAccountSVGProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: number | string;
    height?: number | string;
}

export function FireflyAccountSVG({ className, width, height }: FireflyAccountSVGProps) {
    return (
        <div
            className={classNames('relative', className)}
            style={{
                aspectRatio: '286 / 350',
                width,
                height,
            }}
        >
            <FireflyAccountBg width="100%" height="100%" />
            <motion.div
                className="absolute left-[50.7%] top-0 aspect-square w-[23.08%]"
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
                <FarcasterLogo width="100%" height="100%" />
            </motion.div>

            <motion.div
                className="absolute left-[74.83%] top-[35.71%] aspect-square w-[23.08%]"
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
                <LensLogo width="100%" height="100%" />
            </motion.div>

            <motion.div
                className="absolute left-0 top-[24.86%] w-[21.68%]"
                style={{ aspectRatio: '62 / 64' }}
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
                <TwitterLogo width="100%" height="100%" />
            </motion.div>

            <motion.div
                className="absolute left-[20.28%] top-[48.57%] w-[20.28%]"
                style={{ aspectRatio: '58 / 49' }}
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
                <MessageLogo width="100%" height="100%" />
            </motion.div>
            <motion.div
                className="absolute left-[25.7%] top-[13.42%] w-[20.28%]"
                style={{ aspectRatio: '1 / 1' }}
                animate={{
                    y: [0, -8, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                    times: [0, 0.5, 1],
                }}
            >
                <BskyLogo width="100%" height="100%" />
            </motion.div>
        </div>
    );
}
