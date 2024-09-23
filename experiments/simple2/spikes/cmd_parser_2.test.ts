// deno-lint-ignore-file no-unused-vars no-explicit-any
/**
 * An experiment in trying to apply some type learnings from m-dressler and others.
 */
import { assertEquals, describe, it } from "testlib";
import { booleanFlag, stringFlag } from "../flagParsers.ts";
import type * as v1 from "../types.ts";

/**
 * Tweaking the simple2 typings
 *
 * @md gets around some typing snafus by making Flag a discriminated union
 * of string and boolean flags. I want to see if I can keep this extensible.
 * I suspect I can't, for the same reasons typebox uses JIT code and a
 * registry. but I'm going to give it a try.
 */

// reuse the same definition for a single-value flag and its type extractor
type Flag<V> = v1.Flag<V>;
type FlagType<F> = v1.FlagType<F>;

// Flagsets parse to a structured Result which can also be extracted (ignoring requireds for now)
type Flagset<R> = {
  [k in keyof R]?: Flag<R[k]>;
};

/**
 * A flagset with simple flags args
 */
const assist: Flag<boolean> = {
  name: "assist",
  description: "an optional boolean flag",
  parser: booleanFlag,
  required: false, // ignored for boolean
};
const believe: Flag<string> = {
  name: "believe",
  description: "an optional string flag",
  parser: stringFlag,
  required: false,
};
const flagset = { assist, believe };

interface flagresult {
  assist?: boolean;
  believe?: string;
}

/**
 * Start of Tests
 */
describe("command line parsings with a new take on typing", () => {
});
