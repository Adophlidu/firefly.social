import confetti from 'canvas-confetti';

const DEFAULT_COUNT = 200;
const DEFAULT_OPTIONS: confetti.Options = {
    origin: { y: 0.7 },
    // Render above the wallet panel and app chrome so the celebration covers the full screen.
    zIndex: 100_000,
};

// canvas-confetti's global `confetti()` renders via a Web Worker created from a `blob:` URL.
// Firefly's CSP `worker-src` does not allow `blob:`, so that worker is blocked. Use a custom
// instance with `useWorker: false` to render on the main thread instead (the animation is brief).
const fireConfetti = confetti.create(undefined, { resize: true, useWorker: false });

function fire(particleRatio: number, opts: confetti.Options) {
    fireConfetti({
        ...DEFAULT_OPTIONS,
        ...opts,
        particleCount: Math.floor(DEFAULT_COUNT * particleRatio),
    });
}

export function confettiWithRealistic() {
    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });
    fire(0.2, {
        spread: 60,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
}
