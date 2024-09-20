// deno-lint-ignore-file no-unused-vars
// import * as T from "./types.ts";
import { assertType } from "testlib";
import type { Has, IsExact } from "testlib";
import type { Flag } from "./types.ts";
import { booleanFlag, floatFlag, intFlag, stringFlag } from "./flagParsers.ts";

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
// We can strongly type the flags, here with assignments
const oneTyped: Flag<string> = one;
const dosTyped: Flag<string> = dos;
const threeTyped: Flag<boolean> = three;
const fourTyped: Flag<number> = four;
const cincoTyped: Flag<number> = cinco;
// same thing but with type assertions
assertType<Has<Flag<string>, typeof one>>(true);
assertType<Has<Flag<string>, typeof dos>>(true);
assertType<Has<Flag<boolean>, typeof three>>(true);
assertType<Has<Flag<number>, typeof four>>(true);
assertType<Has<Flag<number>, typeof cinco>>(true);
// and the typings are strict enough to exclude mistakes
assertType<Has<Flag<number>, typeof one>>(false);
assertType<Has<Flag<boolean>, typeof dos>>(false);
assertType<Has<Flag<number>, typeof three>>(false);
assertType<Has<Flag<string>, typeof three>>(false);
assertType<Has<Flag<boolean>, typeof four>>(false);
assertType<Has<Flag<string>, typeof cinco>>(false);

/**
 * We can do the inverse and infer the types a flag parses to
 */

export const flagset1 = { one, dos, three, four, cinco };

type Flagset1 = typeof flagset1;

type Flagset1Flags = {
  one: string | undefined;
  dos: string;
  three: boolean | undefined;
  four: number | undefined;
  cinco: number;
};

/**
 * IN DEV (when working, move to module!)
 */
type FlagType<FT> = FT extends Flag<infer F> ? F : never;

/**
 * Test single flag type extractions
 */
// const oneValue = flagset1.one;
// type oneType = typeof oneValue;
// type oneResultType = FlagType<
// assertType<IsExact<FlagType<oneType>, string | undefined>>(true);

// // as expected, order of union types doesn't matter
// assertType<IsExact<FlagType<oneType>, undefined | string>>(true);

// /**
//  * Pointing out some nuances/bugs about testing types with optional props
//  */
// type optionalT1 = {
//   one?: string;
//   two: string | undefined;
// };
// type optionalT2 = {
//   one?: string;
//   two?: string;
// };
// type optionalT3 = {
//   one?: string;
// };
// assertType<IsExact<FlagType<oneType>, optionalT1["one"]>>(true);
// assertType<IsExact<FlagType<oneType>, optionalT1["two"]>>(true);
// // BUT there's a possible typetest error here:
// // I'd expect the two types, then, to be Exactly the same
// assertType<IsExact<optionalT1, optionalT2>>(false);
// // at least it seems to be commutative
// assertType<IsExact<optionalT2, optionalT1>>(false);
// // The slightly more tolerant **Has** works
// assertType<Has<optionalT1, optionalT2>>(true);
// // BUT it tolerates missing props in the second
// assertType<Has<optionalT1, optionalT3>>(true);
// // So it's not commutative
// assertType<Has<optionalT3, optionalT1>>(false); // !!
// // and it sees optional as a superset of T | undefined
// assertType<Has<optionalT2, optionalT1>>(false); // !!

// /**
//  * Testing all the fields
//  */
// type aOne = Flagset1["one"];
// type bOne = T.FlagType<aOne>;
// type cOne = T.FlagAllowableType<aOne>;
// type aDos = Flagset1["dos"];
// type bDos = T.FlagType<aDos>;
// type cDos = T.FlagAllowableType<aOne>;
// assertType<Has<FlagType<T.FlagType<Flagset1["one"]>>, Flagset1Flags["one"]>>(
//   false,
// );

// /**
//  * Testing inference of the types for flagsets
//  */
// // assertType<IsExact<

// // type huh = T.FlagsetType<Flagset1>;
// assertType<IsExact<T.FlagsetType<Flagset1>, Flagset1Flags>>(false);
