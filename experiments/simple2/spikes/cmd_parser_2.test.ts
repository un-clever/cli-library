// deno-lint-ignore-file no-unused-vars no-explicit-any
/**
 * An experiment in trying to apply some type learnings from m-dressler and others.
 */
import { assertEquals, assertType, describe, IsExact, it } from "testlib";
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

// Flagsets parse to a structured Result when all props are required
type FlagsetRequired<R> = {
  [k in keyof R]: Flag<R[k]>;
};
// Flagsets parse to a structured Result when all Result props are required
// tricky because Flag is not optional, but it's .required if false
type FlagsetOptional<R> = {
  [k in keyof R]: Flag<R[k]>;
};

/**
 * A flagset with simple flags args
 */
function getFlagset() {
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
  return { assist, believe };
}

/**
 * Start of Tests
 */
describe("command line parsings with a new take on typing", () => {
  const flagset = getFlagset();
  const { assist, believe } = flagset;

  // expected type the flagset will produce
  interface flagresult {
    assist?: boolean;
    believe?: string;
  }

  it("Flag types round trip (declare and extract)", () => {
    // check explicit flags we've declared
    assertType<IsExact<FlagType<typeof assist>, boolean>>(true);
    assertType<IsExact<FlagType<typeof believe>, string>>(true);
    // check more complex round tripping
    assertType<IsExact<FlagType<Flag<boolean>>, boolean>>(true);
    assertType<IsExact<FlagType<Flag<string>>, string>>(true);
    // check that the typings are are not too loose
    assertType<IsExact<FlagType<Flag<boolean>>, string>>(false);
    assertType<IsExact<FlagType<Flag<string>>, boolean>>(false);
  });

  it("Flagset types round trip when everything is required", () => {
    assertType<
      IsExact<FlagsetRequired<Required<flagresult>>, Required<typeof flagset>>
    >(true);
  });
  it("Flagset types round trip when everything is optional", () => {
    assertEquals("todo", "");
  });
});
