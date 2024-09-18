export { expect } from "@std/expect";
export { describe, it } from "@std/testing/bdd";

/**
 * Expand these re-exports as needed.
 * We could wildcard import them, with or without a namespacing
 * alias, but this way we know exactly what needs to be ported
 */
export { assert, assertEquals } from "@std/assert";
export { assertType } from "@std/testing/types";

// seems *almost* compatible with node's testing
// as of 18 Sep 2024 defined in
// https://github.com/denoland/deno/cli/js/40_test.js#L338
// and assigned to globalThis.Deno.test at the bottom of the file
// looking at the code, I'd avoid it. It'd be hard to facade into
// something Bun or Node compatible I think, and it's not really
// exposed in any public library.
export const globalTest = Deno.test;
