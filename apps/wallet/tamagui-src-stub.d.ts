// Stub for tamagui v2 packages whose `types` entry points at raw `src/*.ts`
// (@tamagui/element, @tamagui/use-async). Their relative imports omit file
// extensions, which fails under NodeNext (TS2835); skipLibCheck only skips
// `.d.ts`, not `.ts`.
// The wallet pulls these in transitively via tamagui and never imports them
// directly, so resolving them to `any` here (via tsconfig `paths`) is safe and
// keeps the strict NodeNext resolution everywhere else intact.
declare const tamaguiSrcStub: any;
export = tamaguiSrcStub;
