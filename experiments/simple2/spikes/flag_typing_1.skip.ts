// deno-lint-ignore-file no-unused-vars no-explicit-any
/**
 * An experiment in trying to apply some type learnings from m-dressler and others.
 *
 * CONCLUSION: playing with this, I see that the discriminant (in this
 * case, .required), has to be part of the type. So I'd need a OptionalFlag
 * and RequiredFlag as I did in simple2 for inference to work out right.
 *
 * See FlagSetReturn<FS> test (set to false to pass, but should be true)
 */
import { assertType, describe, type IsExact, it } from "testlib";
import { booleanFlag, stringFlag } from "../flags.ts";
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
type FlagsetReturnRequired<FS> = {
  [k in keyof FS]: FlagType<FS[k]>;
};

// Flagsets parse to a structured Result when all Result props are required
// tricky because Flag is not optional, but it's .required if false
type FlagsetOptional<R> = {
  [k in keyof R]-?: Flag<NonNullable<R[k]>>;
};
type FlagsetReturnOptional<FS> = {
  [k in keyof FS]?: FlagType<FS[k]>;
};

// Now trying it with both optionaal and required
// First part is the same a FlagsetOptional, we're ignoring the required field
type Flagset<R> = {
  [k in keyof R]-?: Flag<NonNullable<R[k]>>;
};
// CONCLUSION: playing with this, I see that the discriminant (in this
// case, .required), has to be part of the type. So I'd need a OptionalFlag
// and RequiredFlag as I did in simple2 for inference to work out right.
type Optionalize<
  Required extends boolean | void,
  T,
> = Required extends true ? T : T | undefined;

type OptKeys<FS extends Flagset<unknown>> = keyof FS;

type StrongFlag<F> = F extends v1.RequiredFlag<infer V> ? v1.RequiredFlag<V>
  : v1.OptionalFlag<FlagType<F>>;

type FlagsetReturn<FS extends Flagset<unknown>> = {
  // [k in keyof FS as Exclude<k, "care">]: FlagType<FS[k]>;
  [k in keyof FS]: FS[k] extends v1.RequiredFlag<infer V> ? V : never;
};

type FlagReturn<F extends Flag<unknown>> = Optionalize<
  F["required"],
  FlagType<F>
>;

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

  const care: Flag<string> = {
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
    type resultWithNoOptionals = Required<flagresult>;
    assertType<
      IsExact<FlagsetRequired<resultWithNoOptionals>, typeof flagset>
    >(true);
    assertType<
      IsExact<FlagsetReturnRequired<typeof flagset>, Required<flagresult>>
    >(
      true,
    );
  });
  it("Flagset types round trip when everything is optional", () => {
    assertType<
      IsExact<FlagsetOptional<flagresult>, typeof flagset>
    >(true);
    assertType<
      IsExact<FlagsetReturnOptional<typeof flagset>, Partial<flagresult>>
    >(
      true,
    );
  });
  it("Flagset types round trip with mixed optional and required", () => {
    assertType<
      IsExact<Flagset<flagresult>, typeof flagset>
    >(true);

    type chk = FlagsetReturn<typeof flagset>;
    type chk2 = OptKeys<typeof flagset>;
    type fchk = FlagReturn<typeof assist>;
    type fchk2 = FlagReturn<typeof care>;
    // this demonstrates the problem
    // const f1: v1.OptionalFlag<string> = believe;

    // see CONCLUSION, I want this true, but it can't be dynamically
    assertType<
      IsExact<FlagsetReturn<typeof flagset>, flagresult>
    >(
      false,
    );
  });
});
