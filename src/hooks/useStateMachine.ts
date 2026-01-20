import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Type-safe state machine hook configuration
 * @template TStates - Union type of all possible states
 */
interface StateMachineConfig<TStates extends string> {
    /**
     * Initial state of the machine
     */
    initialState: TStates;
    /**
     * Transition map defining allowed transitions from each state
     * Must include all states as keys, and all transition targets must be valid states
     */
    transitions: Record<TStates, readonly TStates[]>;
    /**
     * Optional callback when state changes
     */
    onStateChange?: (from: TStates, to: TStates) => void;
}

/**
 * State machine hook return value
 */
interface StateMachineReturn<TStates extends string> {
    /**
     * Current state
     */
    state: TStates;
    /**
     * Transition to a new state (only if allowed)
     */
    transition: (to: TStates) => boolean;
    /**
     * Check if a transition is allowed from current state
     */
    canTransition: (to: TStates) => boolean;
    /**
     * Reset to initial state
     */
    reset: () => void;
    /**
     * Check if current state matches any of the provided states
     */
    is: (states: TStates | TStates[]) => boolean;
}

/**
 * A type-safe state machine hook that enforces valid state transitions
 *
 * You only need to specify the state union type. TypeScript will automatically
 * validate that your transitions object includes all states and only allows valid transitions.
 *
 * @example
 * ```ts
 * type FrameViewerState = 'idle' | 'ready' | 'timeout' | 'blocking';
 *
 * const machine = useStateMachine<FrameViewerState>({
 *   initialState: 'idle',
 *   transitions: {
 *     idle: ['ready', 'blocking'],
 *     ready: ['timeout'],
 *     timeout: [],
 *     blocking: [],
 *   },
 *   onStateChange: (from, to) => {
 *     console.log(`State changed from ${from} to ${to}`);
 *   },
 * });
 *
 * machine.transition('ready'); // returns true
 * machine.is('ready'); // returns true
 * machine.canTransition('timeout'); // returns true
 * ```
 */
export function useStateMachine<TStates extends string>(
    config: StateMachineConfig<TStates>,
): StateMachineReturn<TStates> {
    const { initialState, transitions, onStateChange } = config;
    const stateRef = useRef<TStates>(initialState);
    const [, forceUpdate] = useState({});

    const canTransition = useCallback(
        (to: TStates): boolean => {
            const allowedTransitions = transitions[stateRef.current];
            return allowedTransitions.includes(to);
        },
        [transitions],
    );

    const transition = useCallback(
        (to: TStates): boolean => {
            if (!canTransition(to)) {
                return false;
            }

            const from = stateRef.current;
            stateRef.current = to;
            forceUpdate({});
            onStateChange?.(from, to);
            return true;
        },
        [canTransition, onStateChange],
    );

    const reset = useCallback(() => {
        const from = stateRef.current;
        stateRef.current = initialState;
        forceUpdate({});
        if (from !== initialState) {
            onStateChange?.(from, initialState);
        }
    }, [initialState, onStateChange]);

    const is = useCallback((states: TStates | TStates[]): boolean => {
        const statesArray = Array.isArray(states) ? states : [states];
        return statesArray.includes(stateRef.current);
    }, []);

    return useMemo(
        () => ({
            state: stateRef.current,
            transition,
            canTransition,
            reset,
            is,
        }),
        [transition, canTransition, reset, is],
    );
}
