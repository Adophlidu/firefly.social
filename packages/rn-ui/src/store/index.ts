import { createStore } from 'jotai';

/** Dedicated store so rn-ui atoms are isolated from the host app’s default Jotai store. */
export const store = createStore();
