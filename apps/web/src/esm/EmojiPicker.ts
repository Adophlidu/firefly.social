import Picker from 'emoji-picker-react';

// CJS default-export interop differs between bundlers: esbuild (worker bundle)
// yields the module namespace, Vite's dev SSR (native Node) yields the
// __esModule default. Take whichever holds the real export.
const resolved = (Picker as unknown as { default?: unknown }).default ?? Picker;

export const EmojiPicker = resolved as typeof Picker.default;
