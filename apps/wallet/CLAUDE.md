# Firefly Wallet - Claude Code Project Guide

## Project Overview

Firefly Wallet is a Web3 wallet application supporting multi-chain asset management.

### Iframe Integration

This project runs as an iframe embedded in [firefly.social](https://firefly.social) (a Next.js application). The integration uses URL rewrite rules to map `/wallet-iframe/*` to this project.

**Important:** This project depends on JWT stored in localStorage by firefly.social. You must:

1. Run both projects on the same domain (via rewrite)
2. Log in to firefly.social first before using this wallet

**Chrome Testing URLs (localhost:3000 is firefly.social):**

```
# Test firefly.social with wallet integrated
http://localhost:3000

# Test wallet standalone (must be logged in to firefly.social first)
http://localhost:3000/wallet-iframe/
```

Note: Direct access via `localhost:3001` will not work properly due to JWT dependency.

## Tech Stack

- **Framework**: TanStack React Start (full-stack React meta-framework)
- **Routing**: TanStack Router (file-based routing)
- **Language**: TypeScript 5.9 (strict mode)
- **UI**: React 19 + Tailwind CSS 3 + Radix UI + shadcn/ui
- **State Management**: Jotai (atomic state) + TanStack Query (server state)
- **Forms**: React Hook Form + Zod validation
- **i18n**: Lingui
- **Build Tools**: Vite 7 + pnpm 8
- **Testing**: Vitest

### Web3 Integration

- **Solana**: @solana/kit, @solana/spl-token, @coral-xyz/anchor
- **EVM**: wagmi, viem
- **Auth**: Privy

## Project Structure

```
src/
├── abis/          # Smart contract ABIs
├── assets/        # Static assets
├── components/    # Reusable components
├── configs/       # Configuration files
├── constants/     # Constant definitions
├── helpers/       # Utility functions
├── hooks/         # Custom React hooks
├── i18n/          # i18n setup
├── lib/           # Library wrappers
├── locales/       # Translation files (auto-generated)
├── modals/        # Modal components
├── providers/     # Context providers
├── queries/       # React Query queries
├── routes/        # Page routes (TanStack Router)
├── services/      # Business logic / API services
├── store/         # Jotai state atoms
└── types/         # TypeScript type definitions
```

## Common Commands

```bash
pnpm dev           # Start dev server (port 3001)
pnpm build         # Production build
pnpm typecheck     # TypeScript type checking
pnpm lint          # ESLint check
pnpm test          # Run tests
pnpm lingui        # Extract and compile translations
```

## Code Style

### Formatting

- **Indentation**: 4 spaces
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Line width**: 120 characters
- **Trailing commas**: Always

### Import Rules

- Use absolute imports with `@/` prefix
- Imports are auto-sorted (simple-import-sort)
- Relative imports are forbidden

```typescript
// Correct
import { Button } from '@/components/Button';
import { useWallet } from '@/hooks/useWallet';

// Wrong
import { Button } from '../components/Button';
import { Button } from './Button';
```

### React Components

- Use function declarations for named components
- Use self-closing tags
- Omit `={true}` for boolean JSX props

```typescript
// Correct
function MyComponent() {
    return <Button disabled />;
}

// Wrong
const MyComponent = () => {
    return <Button disabled={true}></Button>;
};
```

### TypeScript

- Use `T[]` for simple arrays, `Array<T>` for complex types
- Use `as` for type assertions
- Avoid inferable type annotations

### Tailwind CSS

- Use Tailwind shorthand classes
- Avoid custom class names (use design system)
- Conflicting class names will error

## Important Notes

### Route File Naming

TanStack Router uses file-based routing:

- `_layout.tsx` - Layout files (underscore prefix)
- `$param.tsx` - Dynamic parameters
- `index.tsx` - Index routes

### State Management

- Global state: Jotai atoms (`src/store/`)
- Server data: TanStack Query (`src/queries/`)
- Form state: React Hook Form

### Internationalization

- All user-facing text must use Lingui
- Run `pnpm lingui` to extract new text

```typescript
import { t, Trans } from '@lingui/macro';

// In JSX
<Trans>Hello World</Trans>

// In JS
const message = t`Hello World`;
```

### Numeric Calculations

- Use `bignumber.js` for precise calculations
- Avoid native JavaScript floating-point arithmetic

### Git Commits

- Follow Conventional Commits specification
- Types: feat, fix, chore, docs, style, refactor, test

## Common Gotchas

1. USDC has 6 decimals, not 18
2. Polymarket amounts are raw USDC (e.g., "10500000" = 10.5 USDC)
3. Use `leftShift`/`rightShift` from `@/helpers/number.js` for decimal conversion
4. This project IS a wallet (based on Privy), so swap features should NOT connect to browser extension wallets - always use Privy's embedded wallet
5. Use `useMutation` return values (`isPending`, `isSuccess`, `isError`) instead of creating redundant `useState` to track mutation state

## Environment Variables

Environment variables are configured in Vercel. Local development requires a `.env.local` file.

## Testing

Test files are in the `test/` directory using Vitest:

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
```

## Browser Automation Testing

### Chrome Extension (Interactive)

For interactive debugging with existing browser session:

1. Install [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) (v1.0.36+)
2. Launch Claude Code with Chrome enabled:
    ```bash
    claude --chrome
    ```
3. Or enable via command: `/chrome`

**Use cases:**

- Live debugging with console error reading
- Testing with existing login sessions
- Design verification
- Form validation testing

### Playwright MCP (Automated)

For headless automated testing (configured in `.mcp.json`):

**Available tools:**

- `playwright_navigate` - Navigate to URL
- `playwright_screenshot` - Capture screenshots
- `playwright_click` - Click elements
- `playwright_fill` - Fill form inputs
- `playwright_evaluate` - Execute JavaScript
- `playwright_get_visible_text` - Extract text content

**Example test workflow:**

```
Navigate to localhost:3001, fill the login form with test credentials,
click submit, and verify the dashboard loads correctly.
Take a screenshot of the result.
```

**Check MCP status:** `/mcp`

## Additional Docs

See `.claude/` folder for detailed component and helper documentation.
