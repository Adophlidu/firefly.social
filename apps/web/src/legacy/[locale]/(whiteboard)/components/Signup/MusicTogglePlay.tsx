import MusicBgIcon from '@dimensiondev/assets/music-bg.svg';
import MusicPlayIcon from '@dimensiondev/assets/music-play.svg';
import MusicStopIcon from '@dimensiondev/assets/music-stop.svg';
import { SIGNUP_AUDIO_ID } from '@dimensiondev/constants/static';
import { motion } from 'framer-motion';
import { memo, useEffect, useState } from 'react';

import { toggleSignupAudio } from '@/legacy/[locale]/(whiteboard)/signup/pages/audio.js';

export const MusicTogglePlay = memo(function MusicTogglePlay() {
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const audio = document.getElementById(SIGNUP_AUDIO_ID) as HTMLAudioElement | null;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, []);

    return (
        <motion.button
            className="absolute right-[3.3%] top-[3.7%] z-20 flex size-10 items-center justify-center"
            onClick={toggleSignupAudio}
            whileTap={{ scale: 0.9 }}
        >
            <MusicBgIcon className="absolute inset-0" width={40} height={40} />
            {isPlaying ? (
                <MusicPlayIcon className="z-1 animate-spin duration-[1.5s]" />
            ) : (
                <MusicStopIcon className="z-1" />
            )}
        </motion.button>
    );
});
