import { classNames } from '@dimensiondev/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { type PropsWithChildren } from 'react';

import BskyLogo from '@/assets/bsky-logo.svg';
import CloudBigIcon from '@/assets/cloud-big.svg';
import CloudMediumIcon from '@/assets/cloud-medium.svg';
import CloudSmallIcon from '@/assets/cloud-small.svg';
import CupIcon from '@/assets/cup.svg';
import FarcasterLogo from '@/assets/farcaster-logo.svg';
import HouseIcon from '@/assets/house.svg';
import LensLogo from '@/assets/lens-logo.svg';
import SmallLogo from '@/assets/logo-small.svg';
import SignupBg from '@/assets/signup-bg.svg';
import TwitterLogo from '@/assets/x-logo.svg';
import { SignupStep, Source } from '@/constants/enum.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';

type PageBackgroundProps = PropsWithChildren<{
    step: SignupStep;
}>;

const bgClassNames: Record<SignupStep, string> = {
    [SignupStep.Welcome]: 'bg-[#FFF3EB] text-[#FFE5D4] [--cloud-main-color:#FFCEAD]',
    [SignupStep.LoginSocialPlatform]: 'text-[#DEE8FC] [--cloud-main-color:#C0D3FA]',
    [SignupStep.CreateAccountForm]: 'text-[#DEE8FC] [--cloud-main-color:#C0D3FA]',
    [SignupStep.Success]: 'text-[#DEE8FC] [--cloud-main-color:#C0D3FA]',
};
const bgStyles: Partial<Record<SignupStep, React.CSSProperties>> = {
    [SignupStep.LoginSocialPlatform]: {
        background: 'linear-gradient(180deg, #5E69FF 0%, #79AAFF 45.81%, #9EFFFF 100%)',
    },
    [SignupStep.CreateAccountForm]: {
        background: 'linear-gradient(180deg, #5E69FF 0%, #79AAFF 45.81%, #9EFFFF 100%)',
    },
    [SignupStep.Success]: {
        background: 'linear-gradient(180deg, #5E69FF 0%, #79AAFF 45.81%, #9EFFFF 100%)',
    },
};
const cloudStyles: Record<SignupStep, Record<'small' | 'medium' | 'big', React.CSSProperties>> = {
    [SignupStep.Welcome]: {
        small: { width: '22.08%', right: 'calc(14.69% - 0px)', bottom: 'calc(17.5% - 0px)' },
        medium: { width: '22.08%', left: 'calc(3.54% - 0px)', top: 'calc(7.96% - 0px)' },
        big: { width: '43.75%', right: '0', top: '5.37%' },
    },
    [SignupStep.LoginSocialPlatform]: {
        small: { width: '22.08%', right: 'calc(16.18% - 0px)', bottom: 'calc(40.37% - 0px)' },
        medium: { width: '22.08%', left: 'calc(4.61% - 0px)', top: 'calc(30% - 0px)' },
        big: { width: '43.75%', right: '0', top: '5.37%' },
    },
    [SignupStep.CreateAccountForm]: {
        small: { width: '22.08%', right: 'calc(16.18% - 0px)', bottom: 'calc(40.37% - 0px)' },
        medium: { width: '22.08%', left: 'calc(4.61% - 0px)', top: 'calc(30% - 0px)' },
        big: { width: '43.75%', right: '0', top: '5.37%' },
    },
    [SignupStep.Success]: {
        small: { width: '22.08%', right: 'calc(16.18% - 0px)', bottom: 'calc(40.37% - 0px)' },
        medium: { width: '22.08%', left: 'calc(4.61% - 0px)', top: 'calc(30% - 0px)' },
        big: { width: '43.75%', right: '0', top: '5.37%' },
    },
};

export function PageBackground({ step, children }: PageBackgroundProps) {
    const profileAll = useCurrentProfilesAll();

    return (
        <div
            className={classNames('no-scrollbar light relative h-screen w-screen overflow-hidden', bgClassNames[step])}
            style={bgStyles[step]}
        >
            {step !== SignupStep.Welcome ? <SmallLogo className="absolute left-[2.26%] top-[1.85%]" /> : null}
            <div className="absolute" style={cloudStyles[step].big}>
                <CloudBigIcon width="100%" />
            </div>
            <motion.div
                className="absolute"
                style={cloudStyles[step].medium}
                transition={{
                    type: 'spring',
                    damping: 15,
                    stiffness: 100,
                    mass: 0.5,
                    duration: 0.3,
                }}
                animate={{
                    left: cloudStyles[step].medium.left,
                    top: cloudStyles[step].medium.top,
                }}
            >
                <CloudMediumIcon width="100%" />
            </motion.div>
            <motion.div
                className="absolute"
                style={cloudStyles[step].small}
                transition={{
                    type: 'spring',
                    damping: 15,
                    stiffness: 100,
                    mass: 0.5,
                    duration: 0.3,
                }}
                animate={{
                    right: cloudStyles[step].small.right,
                    bottom: cloudStyles[step].small.bottom,
                }}
            >
                <CloudSmallIcon width="100%" />
            </motion.div>
            <AnimatePresence>
                {step !== SignupStep.Welcome ? (
                    <motion.div
                        className="absolute inset-x-0 bottom-0 w-full"
                        style={{
                            aspectRatio: '1922 / 404',
                        }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 15,
                            stiffness: 100,
                            mass: 0.5,
                            duration: 0.3,
                        }}
                    >
                        <SignupBg className="absolute inset-0 size-full" width="100%" height="100%" />
                        {profileAll[Source.Lens] ? (
                            <div className="absolute bottom-0 left-[80.6%] pb-[11.2%]">
                                <motion.div
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
                                    <LensLogo width="3vw" height="3vw" />
                                </motion.div>
                            </div>
                        ) : null}
                        {profileAll[Source.Farcaster] ? (
                            <div className="absolute bottom-0 left-[76.6%] pb-[2.5%]">
                                <motion.div
                                    animate={{
                                        y: [0, -12, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatType: 'reverse',
                                        ease: 'easeInOut',
                                        times: [0, 0.4, 1],
                                        delay: 0.5,
                                    }}
                                >
                                    <FarcasterLogo width="3vw" height="3vw" />
                                </motion.div>
                            </div>
                        ) : null}
                        {profileAll[Source.Twitter] ? (
                            <div className="absolute bottom-0 left-[49%] pb-[4%]">
                                <motion.div
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
                                    <TwitterLogo width="4vw" height="4vw" />
                                </motion.div>
                            </div>
                        ) : null}
                        {profileAll[Source.Bsky] ? (
                            <div className="absolute bottom-0 left-[20%] pb-[7.6%]">
                                <motion.div
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
                                    <BskyLogo width="3vw" height="3vw" />
                                </motion.div>
                            </div>
                        ) : null}
                        <div className="absolute bottom-0 left-[22.8%] pb-[2%]">
                            <CupIcon width="7.5vw" height="7.5vw" />
                        </div>
                        <div className="absolute bottom-0 left-[47.2%] pb-[3%]">
                            <HouseIcon width="24.74vw" height="15.42vw" />
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
            {children}
        </div>
    );
}
