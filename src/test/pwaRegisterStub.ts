// Vitest does not install service workers. Route tests replace this adapter.
export function useRegisterSW(): never {
  throw new Error(
    'Mock useRegisterSW explicitly in tests that render the PWA boundary.',
  );
}
