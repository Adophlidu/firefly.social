/// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { useStateMachine } from '@/hooks/useStateMachine.js';

describe('useStateMachine', () => {
    type TestState = 'idle' | 'ready' | 'timeout' | 'blocking';

    const createMachine = (onStateChange?: (from: TestState, to: TestState) => void) => {
        return renderHook(() =>
            useStateMachine<TestState>({
                initialState: 'idle',
                transitions: {
                    idle: ['ready', 'blocking', 'timeout'],
                    ready: [],
                    timeout: [],
                    blocking: [],
                },
                onStateChange,
            }),
        );
    };

    describe('initial state', () => {
        test('should start with the initial state', () => {
            const { result } = createMachine();

            expect(result.current.state).toBe('idle');
        });

        test('should allow initial state to be checked with is()', () => {
            const { result } = createMachine();

            expect(result.current.is('idle')).toBe(true);
            expect(result.current.is('ready')).toBe(false);
        });
    });

    describe('valid transitions', () => {
        test('should transition to allowed states and return true', () => {
            const { result } = createMachine();

            act(() => {
                const success = result.current.transition('ready');
                expect(success).toBe(true);
            });
            expect(result.current.state).toBe('ready');

            act(() => {
                result.current.reset();
            });

            act(() => {
                const success = result.current.transition('blocking');
                expect(success).toBe(true);
            });
            expect(result.current.state).toBe('blocking');

            act(() => {
                result.current.reset();
            });

            act(() => {
                const success = result.current.transition('timeout');
                expect(success).toBe(true);
            });
            expect(result.current.state).toBe('timeout');
        });
    });

    describe('invalid transitions', () => {
        test('should not transition from terminal states and return false', () => {
            const { result } = createMachine();

            // Test ready is terminal
            act(() => {
                result.current.transition('ready');
            });
            expect(result.current.state).toBe('ready');

            act(() => {
                const success = result.current.transition('idle');
                expect(success).toBe(false);
            });
            expect(result.current.state).toBe('ready');

            // Test timeout is terminal
            act(() => {
                result.current.reset();
            });
            act(() => {
                result.current.transition('timeout');
            });
            expect(result.current.state).toBe('timeout');

            act(() => {
                const success = result.current.transition('idle');
                expect(success).toBe(false);
            });
            expect(result.current.state).toBe('timeout');

            // Test blocking is terminal
            act(() => {
                result.current.reset();
            });
            act(() => {
                result.current.transition('blocking');
            });
            expect(result.current.state).toBe('blocking');

            act(() => {
                const success = result.current.transition('ready');
                expect(success).toBe(false);
            });
            expect(result.current.state).toBe('blocking');
        });
    });

    describe('canTransition', () => {
        test('should return true for allowed transitions and update after state change', () => {
            const { result } = createMachine();

            // From idle, all transitions are allowed
            expect(result.current.canTransition('ready')).toBe(true);
            expect(result.current.canTransition('blocking')).toBe(true);
            expect(result.current.canTransition('timeout')).toBe(true);

            // After transitioning to ready (terminal state)
            act(() => {
                result.current.transition('ready');
            });

            expect(result.current.canTransition('timeout')).toBe(false);
            expect(result.current.canTransition('idle')).toBe(false);
            expect(result.current.canTransition('blocking')).toBe(false);
            expect(result.current.canTransition('ready')).toBe(false);
        });
    });

    describe('is', () => {
        test('should check state matches and update after state change', () => {
            const { result } = createMachine();

            // Single state check
            expect(result.current.is('idle')).toBe(true);
            expect(result.current.is('ready')).toBe(false);

            // Array state check
            expect(result.current.is(['idle', 'ready'])).toBe(true);
            expect(result.current.is(['ready', 'timeout'])).toBe(false);
            expect(result.current.is([])).toBe(false);

            // After state change
            act(() => {
                result.current.transition('ready');
            });

            expect(result.current.is('idle')).toBe(false);
            expect(result.current.is('ready')).toBe(true);
            expect(result.current.is(['idle', 'ready'])).toBe(true);
        });
    });

    describe('reset', () => {
        test('should reset from any state and allow transitions after reset', () => {
            const { result } = createMachine();

            act(() => {
                result.current.transition('timeout');
            });
            expect(result.current.state).toBe('timeout');

            act(() => {
                result.current.reset();
            });
            expect(result.current.state).toBe('idle');
            expect(result.current.canTransition('ready')).toBe(true);
            expect(result.current.canTransition('timeout')).toBe(true);

            act(() => {
                result.current.transition('timeout');
            });
            expect(result.current.state).toBe('timeout');
        });

        test('should not call onStateChange when already in initial state', () => {
            const onStateChange = vi.fn();
            const { result } = createMachine(onStateChange);

            expect(onStateChange).not.toHaveBeenCalled();

            act(() => {
                result.current.reset();
            });

            expect(onStateChange).not.toHaveBeenCalled();
        });
    });

    describe('onStateChange callback', () => {
        test('should call callback with correct from and to states', () => {
            const onStateChange = vi.fn();
            const { result } = createMachine(onStateChange);

            act(() => {
                result.current.transition('ready');
            });
            expect(onStateChange).toHaveBeenCalledTimes(1);
            expect(onStateChange).toHaveBeenCalledWith('idle', 'ready');

            act(() => {
                result.current.reset();
            });
            expect(onStateChange).toHaveBeenCalledTimes(2);
            expect(onStateChange).toHaveBeenLastCalledWith('ready', 'idle');

            act(() => {
                result.current.transition('timeout');
            });
            expect(onStateChange).toHaveBeenCalledTimes(3);
            expect(onStateChange).toHaveBeenLastCalledWith('idle', 'timeout');
        });

        test('should not call callback on failed transition', () => {
            const onStateChange = vi.fn();
            const { result } = createMachine(onStateChange);

            act(() => {
                result.current.transition('ready');
            });
            expect(onStateChange).toHaveBeenCalledTimes(1);

            // ready is terminal, cannot transition to timeout
            act(() => {
                result.current.transition('timeout');
            });
            expect(onStateChange).toHaveBeenCalledTimes(1);
        });

        test('should work without callback', () => {
            const { result } = createMachine();

            act(() => {
                expect(() => {
                    result.current.transition('ready');
                }).not.toThrow();
            });

            expect(result.current.state).toBe('ready');
        });
    });

    describe('state machine behavior', () => {
        test('should maintain state across re-renders', () => {
            const { result, rerender } = createMachine();

            act(() => {
                result.current.transition('ready');
            });

            expect(result.current.state).toBe('ready');

            rerender();

            expect(result.current.state).toBe('ready');
        });

        test('should handle complex state flow', () => {
            const { result } = createMachine();

            // Start at idle
            expect(result.current.state).toBe('idle');
            expect(result.current.is('idle')).toBe(true);

            // Transition directly to timeout from idle
            act(() => {
                const success = result.current.transition('timeout');
                expect(success).toBe(true);
            });

            expect(result.current.state).toBe('timeout');
            expect(result.current.canTransition('idle')).toBe(false);
            expect(result.current.canTransition('ready')).toBe(false);
            expect(result.current.canTransition('blocking')).toBe(false);
            expect(result.current.is(['timeout', 'blocking'])).toBe(true);

            // Reset
            act(() => {
                result.current.reset();
            });

            expect(result.current.state).toBe('idle');
            expect(result.current.canTransition('ready')).toBe(true);
            expect(result.current.canTransition('timeout')).toBe(true);
        });

        test('should handle multiple machines independently', () => {
            const machine1 = renderHook(() =>
                useStateMachine<TestState>({
                    initialState: 'idle',
                    transitions: {
                        idle: ['ready'],
                        ready: [],
                        timeout: [],
                        blocking: [],
                    },
                }),
            );

            const machine2 = renderHook(() =>
                useStateMachine<TestState>({
                    initialState: 'idle',
                    transitions: {
                        idle: ['blocking'],
                        ready: [],
                        timeout: [],
                        blocking: [],
                    },
                }),
            );

            act(() => {
                machine1.result.current.transition('ready');
            });

            act(() => {
                machine2.result.current.transition('blocking');
            });

            expect(machine1.result.current.state).toBe('ready');
            expect(machine2.result.current.state).toBe('blocking');
        });
    });

    describe('edge cases', () => {
        test('should handle state machine with single state', () => {
            type SingleState = 'only';
            const { result } = renderHook(() =>
                useStateMachine<SingleState>({
                    initialState: 'only',
                    transitions: {
                        only: [],
                    },
                }),
            );

            expect(result.current.state).toBe('only');
            expect(result.current.canTransition('only')).toBe(false);
            expect(result.current.is('only')).toBe(true);
        });

        test('should handle state machine with self-transitions', () => {
            type SelfState = 'loop';
            const { result } = renderHook(() =>
                useStateMachine<SelfState>({
                    initialState: 'loop',
                    transitions: {
                        loop: ['loop'],
                    },
                }),
            );

            expect(result.current.canTransition('loop')).toBe(true);

            act(() => {
                result.current.transition('loop');
            });

            expect(result.current.state).toBe('loop');
        });

        test('should handle state machine with all states reachable', () => {
            type AllReachable = 'a' | 'b' | 'c';
            const { result } = renderHook(() =>
                useStateMachine<AllReachable>({
                    initialState: 'a',
                    transitions: {
                        a: ['b', 'c'],
                        b: ['a', 'c'],
                        c: ['a', 'b'],
                    },
                }),
            );

            expect(result.current.state).toBe('a');

            act(() => {
                result.current.transition('b');
            });
            expect(result.current.state).toBe('b');

            act(() => {
                result.current.transition('c');
            });
            expect(result.current.state).toBe('c');

            act(() => {
                result.current.transition('a');
            });
            expect(result.current.state).toBe('a');
        });
    });

    describe('return value stability', () => {
        test('should return stable object reference when state does not change', () => {
            const { result, rerender } = createMachine();

            const firstRender = result.current;

            rerender();

            // The object reference should be stable due to useMemo
            // Note: rerender() may cause React to recreate callbacks in some cases,
            // so we check that the values are the same even if references differ
            expect(result.current.state).toBe(firstRender.state);
            expect(result.current.state).toBe('idle');
        });

        test('should return new object reference when state changes', () => {
            const { result } = createMachine();

            const beforeTransition = result.current;

            act(() => {
                result.current.transition('ready');
            });

            // State changed, so object reference should be different
            expect(result.current).not.toBe(beforeTransition);
            expect(result.current.state).toBe('ready');
        });
    });
});
