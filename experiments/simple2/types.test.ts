// deno-lint-ignore-file no-unused-vars
// import * as T from "./types.ts";
import { assertType } from "testlib";
import type { Has, IsExact } from "testlib";
import type {
  Flag,
  FlagParsed,
  FlagsetParsed,
  OptionalFlag,
  RequiredFlag,
} from "./types.ts";
import { booleanFlag, floatFlag, intFlag, stringFlag } from "./flagParsers.ts";
import { describe } from "@std/testing/bdd";

// Demonstrating a simple type test. They're weird looking at first.
assertType<IsExact<string, string>>(true);
assertType<IsExact<string, number>>(false);

/**
 * start with some hard-coded flags
 */

const one = {
  name: "one",
  description: "your argument named one",
  required: false,
  parser: stringFlag,
};

const dos = {
  name: "dos",
  description: "your argument named dos",
  required: true,
  parser: stringFlag,
};

const three = {
  name: "three",
  description: "your argument named three",
  required: false,
  parser: booleanFlag,
};

const four = {
  name: "four",
  description: "your argument named four",
  required: false,
  parser: floatFlag,
};

const cinco = {
  name: "cinco",
  description: "your argument named cinco",
  required: true,
  parser: intFlag,
};

/**
 * Test single flag type typings
 */
describe("we can strongly type flags");
// We can strongly type the flags, here with assignments
const oneTyped: Flag<string> = one;
const dosTyped: Flag<string> = dos;
const threeTyped: Flag<boolean> = three;
const fourTyped: Flag<number> = four;
const cincoTyped: Flag<number> = cinco;
// ...same thing but with type assertions
assertType<Has<Flag<string>, typeof one>>(true);
assertType<Has<Flag<string>, typeof dos>>(true);
assertType<Has<Flag<boolean>, typeof three>>(true);
assertType<Has<Flag<number>, typeof four>>(true);
assertType<Has<Flag<number>, typeof cinco>>(true);
// ...and the typings are strict enough to exclude mistakes
assertType<Has<Flag<number>, typeof one>>(false);
assertType<Has<Flag<boolean>, typeof dos>>(false);
assertType<Has<Flag<number>, typeof three>>(false);
assertType<Has<Flag<string>, typeof three>>(false);
assertType<Has<Flag<boolean>, typeof four>>(false);
assertType<Has<Flag<string>, typeof cinco>>(false);

/**
 * We can do the inverse and extract the type that the flag will parse to based
 * on its .parser prop, e.g. stringFlag => string
 */
describe("we can extract the type a flag will parse into");
assertType<IsExact<FlagParsed<typeof one>, string>>(true);
assertType<IsExact<FlagParsed<typeof dos>, string>>(true);
assertType<IsExact<FlagParsed<typeof three>, boolean>>(true);
assertType<IsExact<FlagParsed<typeof four>, number>>(true);
assertType<IsExact<FlagParsed<typeof cinco>, number>>(true);
// ...and they're specific enough to fail when it's wrong
assertType<IsExact<FlagParsed<typeof one>, boolean>>(false);
assertType<IsExact<FlagParsed<typeof dos>, number>>(false);
assertType<IsExact<FlagParsed<typeof three>, number>>(false);
assertType<IsExact<FlagParsed<typeof three>, string>>(false);
assertType<IsExact<FlagParsed<typeof four>, string>>(false);
assertType<IsExact<FlagParsed<typeof cinco>, boolean>>(false);

/**
 * But some flags aren't required, so they might be allowed to
 * be a type or undefined.
 */
// type AllowedFlagType<FT extends {required: true}> = FT extends Flag<infer F> ? F : never;
// type q1 = AllowedFlagType<typeof one>;
// type q2 = AllowedFlagType<typeof dos>;

/**
 * We can tighten those types to reflect the .required flag
 */
// To use these, we have to explicitly type the flag structs
const oneOpt: OptionalFlag<string> = {
  name: "one",
  description: "your argument named one",
  required: false,
  parser: stringFlag,
};
const dosReq: RequiredFlag<string> = {
  name: "dos",
  description: "your argument named dos",
  required: true,
  parser: stringFlag,
};
describe("Not quite: there are problems with the Optional/Required inference");
// The exact typings assert false when we want true
assertType<IsExact<OptionalFlag<string>, typeof one>>(false);
assertType<IsExact<RequiredFlag<string>, typeof dos>>(false);
// The more general Has passes...
assertType<Has<OptionalFlag<string>, typeof one>>(true);
assertType<Has<RequiredFlag<string>, typeof dos>>(true);
// ...but it's a false positive. These should assert false
assertType<Has<RequiredFlag<string>, typeof one>>(true);
assertType<Has<OptionalFlag<string>, typeof dos>>(true);

describe("But Optional and required widen correctly");
const oneGeneralizedB: Flag<string> = oneOpt;
const dosGeneralizedB: Flag<string> = oneOpt;

/**
 * Flagset Inference
 */
describe("We can infer expected parse result types from typed flagsets");
// A flagset made from strongly-typed flag defs
const flagset2 = {
  one: oneOpt,
  dos: dosReq,
};
// intellisense will show you what this results in
type FlagParse2Inferred = FlagsetParsed<typeof flagset2>;

type FlagParse2Expected = {
  one: string | undefined;
  dos: string;
};

assertType<IsExact<FlagParse2Inferred, FlagParse2Expected>>(true);

// IWBNI the type assertions understood the equivalence of
// optional props with string | undefined. It is, semantically,
// distinct that the optional prop can be missing, but neither
// never nor undefined suffice for that,
type FlagParse2Someday = {
  one?: string;
  dos: string;
};
// ...but they don't (yet)
assertType<IsExact<FlagParse2Inferred, FlagParse2Someday>>(false);
// ...Not even when they're literal
assertType<IsExact<FlagParse2Expected, FlagParse2Someday>>(false);
// ...Not even when we add never
assertType<
  IsExact<
    { one: string | undefined | never; dos: string },
    FlagParse2Someday
  >
>(false);
// Loosening the test to use Has works, but it's not
// commutative (nor, in this case, intuitive)
assertType<Has<FlagParse2Someday, FlagParse2Expected>>(false);
assertType<Has<FlagParse2Expected, FlagParse2Someday>>(true);
