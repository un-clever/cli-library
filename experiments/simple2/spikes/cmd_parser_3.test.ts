// deno-lint-ignore-file no-unused-vars no-explicit-any
/**
 * Another experiment:
 * 1. Use https://blog.beraliv.dev/2021-12-07-get-optional to better type Flagset
 * 2. Have Flag be a union type atop req and opt instead of beneath it
 *
 * CONCLUSION: wip...
 */
import { assertType, describe, type IsExact, it } from "testlib";
import { booleanFlag, stringFlag } from "../flagParsers.ts";
import type * as v1 from "../types.ts";

/**
 * Tweaking the simple2 typings
 */

// reuse the same definition for a single-value flag and its type extractor
type BaseFlag<V> = {
  // the long flag slug, e.g. "keep" for a flag named --keep
  name: string;
  description: string;
  // parser function
  parser: v1.FlagParser<V>;
  // possible default value
  default?: V;
  // alternative slugs that should be prefixed with --
  aliases?: string[];
  // single character shortcuts to be prefixed with -
  shortcuts?: string;
};
type RequiredFlag<V> = v1.RequiredFlag<V> & { required: true };
type OptionalFlag<V> = v1.OptionalFlag<V> & { required: false };
type Flag<V> = RequiredFlag<V> | OptionalFlag<V>;

type FlagType<F> = F extends Flag<infer V> ? V : never;
type FlagReturn<F> = F extends RequiredFlag<infer V> ? V
  : F extends OptionalFlag<infer V> ? V | undefined
  : never;

/**
 * A flagset with simple flags args
 */
function getFlagset() {
  const assist: OptionalFlag<boolean> = {
    name: "assist",
    description: "an optional boolean flag",
    parser: booleanFlag,
    required: false, // ignored for boolean
  };

  const believe: OptionalFlag<string> = {
    name: "believe",
    description: "an optional string flag",
    parser: stringFlag,
    required: false,
  };

  const care: RequiredFlag<string> = {
    name: "believe",
    description: "a required string flag",
    parser: stringFlag,
    required: true,
  };
  return { assist, believe, care };
}

/**
 * Start of Tests
 */
describe("command line parsings with a new take on typing", () => {
  const flagset = getFlagset();
  const { assist, believe, care } = flagset;

  // expected type the flagset will produce
  interface flagresult {
    assist?: boolean;
    believe?: string;
    care: string;
  }

  it("Flag types and return types round trip (declare and extract)", () => {
    // check explicit flags we've declared
    assertType<IsExact<FlagType<typeof assist>, boolean>>(true);
    assertType<IsExact<FlagType<typeof believe>, string>>(true);
    assertType<IsExact<FlagType<typeof care>, string>>(true);
    // check more abstract round tripping
    assertType<IsExact<FlagType<OptionalFlag<boolean>>, boolean>>(true);
    assertType<IsExact<FlagType<OptionalFlag<string>>, string>>(true);
    assertType<IsExact<FlagType<RequiredFlag<string>>, string>>(true);
    // check that the typings are are not too loose
    assertType<IsExact<FlagType<Flag<boolean>>, string>>(false);
    assertType<IsExact<FlagType<Flag<string>>, boolean>>(false);
    // Optional types also can be undefined
    assertType<IsExact<FlagReturn<typeof assist>, boolean | undefined>>(true);
    assertType<IsExact<FlagReturn<typeof assist>, undefined | boolean>>(true);
    assertType<IsExact<FlagReturn<typeof assist>, undefined>>(false);
    assertType<IsExact<FlagReturn<typeof assist>, boolean>>(false);
    // required flags can't
    assertType<IsExact<FlagReturn<typeof care>, string>>(true);
    assertType<IsExact<FlagReturn<typeof care>, undefined | string>>(false);
    assertType<IsExact<FlagReturn<typeof care>, undefined>>(false);
  });
});
