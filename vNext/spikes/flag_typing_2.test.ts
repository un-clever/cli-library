// deno-lint-ignore-file no-unused-vars no-explicit-any
/**
 * Another experiment:
 * 1. Use https://blog.beraliv.dev/2021-12-07-get-optional to better type Flagset
 * 2. Have Flag be a union type atop req and opt instead of beneath it
 *
 * CONCLUSION: wip...
 */
import { assertType, describe, Has, type IsExact, it } from "testlib";
import { booleanFlag, stringFlag } from "../flags.ts";
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
type RequiredFlag<V> = BaseFlag<V> & { required: true };
type OptionalFlag<V> = BaseFlag<V> & { required: false };
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

  const miniOpt = { believe };
  type TminiOpt = { believe?: string };
  const miniReq = { care };
  type TminiReq = { care: string };
  const miniBoth = { believe, care };
  type TminiBoth = { believe?: string; care: string }; //TminiOpt & TminiReq;

  it("Flagset types work when every prop is required ", () => {
    type FlagsetRequired<VV> = {
      [K in keyof VV]-?: RequiredFlag<VV[K]>;
    };
    assertType<IsExact<FlagsetRequired<TminiReq>, typeof miniReq>>(
      true,
    );
    assertType<IsExact<FlagsetRequired<TminiOpt>, typeof miniOpt>>(
      false,
    );
  });

  it("TODO: Flagset types work when every prop is optional ", () => {
    type FlagsetOptional<VV> = {
      [K in keyof VV]-?: OptionalFlag<NonNullable<VV[K]>>;
    };
    assertType<IsExact<FlagsetOptional<TminiReq>, typeof miniReq>>(
      false,
    );
    assertType<IsExact<FlagsetOptional<TminiOpt>, typeof miniOpt>>(
      true,
    );
  });

  it("Flagset types work with mixed optional and required", () => {
    type Flagset<VV> = {
      // "{} extends Pick<VV, K>" tests for an optional prop
      // creds to https://blog.beraliv.dev/2021-12-07-get-optional
      // deno-lint-ignore ban-types
      [K in keyof VV]-?: {} extends Pick<VV, K> ? OptionalFlag<VV[K]>
        : RequiredFlag<VV[K]>;
    };
    // GREAT!
    const _checkReq: Flagset<{ care: string }> = miniReq;
    assertType<IsExact<Flagset<{ care: string }>, typeof miniReq>>(
      true,
    );

    // SO-SO: requires explicit type
    const _checkOpt: Flagset<{ believe?: string }> = miniOpt;
    assertType<IsExact<Flagset<{ believe?: string }>, typeof _checkOpt>>(true);
    // TODO: maybe BUG?: it can infer required properly but not optional
    // changing to union of remapped keys *might* help?
    assertType<IsExact<Flagset<{ believe?: string }>, typeof miniOpt>>(false);

    // SO-SO: also requires explicit type. See TODO and BUG above
    const _checkBoth: Flagset<{ believe?: string; care: string }> = miniBoth;
    assertType<
      IsExact<Flagset<{ believe?: string; care: string }>, typeof _checkBoth>
    >(
      true,
    );
  });

  it("We can extract the flagset return type", () => {
    type EasyFlagsetReturn<FF> = { [K in keyof FF]: FlagReturn<FF[K]> };
    type OptFlagsReturn<FF> = {
      [K in keyof FF as FF[K] extends OptionalFlag<unknown> ? K : never]?:
        FF[K] extends OptionalFlag<infer V> ? V : never;
    };
    type ReqFlagsReturn<FF> = {
      // [K in keyof FF]: FlagReturn<FF[K]>;
      [K in keyof FF as FF[K] extends RequiredFlag<unknown> ? K : never]:
        FF[K] extends RequiredFlag<infer V> ? V : never;
    };
    type FlagsetReturn<FF> = OptFlagsReturn<FF> & ReqFlagsReturn<FF>;

    type tmb = typeof miniBoth;
    type chkOpt = OptFlagsReturn<tmb>;
    type chkReq = ReqFlagsReturn<tmb>;
    // type Reqs<T> = {
    //   [K for keyof T as {} extends Pick<T,K> ? never : K]: T[K];
    // }

    // // deno-lint-ignore ban-types
    // type chk1 = Reqs<flagresult>;

    // Required is Easy
    assertType<IsExact<FlagsetReturn<typeof miniReq>, TminiReq>>(true);

    // Optional with T | undefined isn't hard either
    assertType<
      IsExact<
        EasyFlagsetReturn<typeof miniOpt>,
        { believe: string | undefined }
      >
    >(
      true,
    );
    // Actual optional props are harder
    assertType<IsExact<FlagsetReturn<typeof miniOpt>, TminiOpt>>(true);

    assertType<
      IsExact<
        FlagsetReturn<typeof miniBoth>,
        { believe?: string; care: string }
      >
    >(true);
  });
});
