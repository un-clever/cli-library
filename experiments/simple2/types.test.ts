// deno-lint-ignore-file no-unused-vars
// import * as T from "./types.ts";
import { assertType } from "testlib";
import type { Has, IsExact } from "testlib";
import type { Flag, FlagType } from "./types.ts";
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
assertType<IsExact<FlagType<typeof one>, string>>(true);
assertType<IsExact<FlagType<typeof dos>, string>>(true);
assertType<IsExact<FlagType<typeof three>, boolean>>(true);
assertType<IsExact<FlagType<typeof four>, number>>(true);
assertType<IsExact<FlagType<typeof cinco>, number>>(true);
// ...and they're specific enough to fail when it's wrong
assertType<IsExact<FlagType<typeof one>, boolean>>(false);
assertType<IsExact<FlagType<typeof dos>, number>>(false);
assertType<IsExact<FlagType<typeof three>, number>>(false);
assertType<IsExact<FlagType<typeof three>, string>>(false);
assertType<IsExact<FlagType<typeof four>, string>>(false);
assertType<IsExact<FlagType<typeof cinco>, boolean>>(false);

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
describe(
  "SEMI-BROKEN WIP: we can tighten those types to reflect whether they're required or not",
);
type OptionalFlag<F> = Flag<F> & { required: false };
type RequiredFlag<F> = Flag<F> & { required: true };

function isOptional<X>(flag: Flag<X>): flag is OptionalFlag<X> {
  return !flag.required;
}
function isRequired<X>(flag: Flag<X>): flag is OptionalFlag<X> {
  return flag.required;
}

// We can explicitly type definitions
const oneExplicitlyOptional: OptionalFlag<string> = {
  name: "one",
  description: "your argument named one",
  required: false,
  parser: stringFlag,
};
describe("there are some problems with these typings");
// ... but the type assertion isn't specific enough. We expect these to be true
assertType<Has<OptionalFlag<string>, typeof one>>(true);
assertType<Has<RequiredFlag<string>, typeof dos>>(true);
// ...but these should be false (and they're not)
// FIX: assertType<Has<OptionalFlag<string>, typeof dos>>(false);
// FIX: assertType<Has<RequiredFlag<string>, typeof one>>(false);

// and unexpectedly, though 'one' is an untyped literal...
const oneRegardless: Flag<string> = one; // the general assignment works
if (isOptional(one)) { const optionalOne: OptionalFlag<string> = one; } // but the narrowed one needs a guard
// and this guard fails
// FIX: if (isRequired(dos)) { const requiredDos: RequiredFlag<string> = dos; } // but the narrowed one needs a guard
// const oneOptional: OptionalFlag<string> = one; // this won't compile (as of 20 Sep 2024)

/**
 * Flagsets
 * We can do similar operations on flagsets
 */
describe("TODO: we can strongly type flagsets");
// lets combine those flags into a flagset
export const flagset1 = { one, dos, three, four, cinco };
// ...with this type
type Flagset1 = typeof flagset1;
// ...that parses out to this type
// NOTICE that flags with .required=false become optional props
type Flagparse1 = {
  one?: string;
  dos: string;
  three?: boolean;
  four?: number;
  cinco: number;
};

// DEV STUFF: move to module once working
// Milestone 1: I can extract the fields as all optional or all required
type FlagsetTypeRequired<FST> = {
  [K in keyof FST]: FST[K] extends Flag<infer F> ? F
    : never;
};
type FlagsetTypePartial<FST> = {
  [K in keyof FST]?: FST[K] extends Flag<infer F> ? F
    : never;
};
assertType<IsExact<Required<Flagparse1>, FlagsetTypeRequired<Flagset1>>>(true);
assertType<IsExact<Partial<Flagparse1>, FlagsetTypePartial<Flagset1>>>(true);
