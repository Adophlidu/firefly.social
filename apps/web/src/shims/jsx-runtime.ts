// Re-export the React APIs SVGR-generated components import (see the
// jsxRuntimeImport option in vite.config.ts) so they can resolve them from
// within apps/web, where react is a real dependency — packages/assets,
// whose SVGs become React components, declares no react dependency itself.
export { forwardRef } from 'react';
export { Fragment, jsx, jsxs } from 'react/jsx-runtime';
