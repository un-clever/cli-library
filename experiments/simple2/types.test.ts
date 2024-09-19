import * as T from "./types.ts";
import { assertType, describe } from "testlib";
import type { Has, IsExact } from "testlib";
import { booleanFlag, floatFlag, intFlag, stringFlag } from "./flagParsers.ts";
import { Flag, FlagParser, FlagType } from "./types.ts";

export function makeFlag<T>(
  name: string,
  parser: FlagParser<T>,
  required = false,
): Flag<T> {
  return {
    name,
    description: `your argument named ${name}`,
    parser,
    required,
    default: undefined,
  };
}

/**
 * A simple FlagSpec that could drive a parser
 */
export const flagset1 = {
  one: makeFlag<string>("one", stringFlag),
  dos: makeFlag<string>("dos", stringFlag, true),
  three: makeFlag<boolean>("three", booleanFlag),
  four: makeFlag<number>("four", floatFlag),
  cinco: makeFlag<number>("cinco", intFlag, true),
};

type Flagset1 = {
  one?: string;
  dos: string;
  three?: boolean;
  four?: number;
  cinco: number;
};

// Demonstrating a simple type test. They're weird looking at first.
assertType<IsExact<string, string>>(true);
assertType<IsExact<string, number>>(false);

// Test single flag type extractions
const oneValue = flagset1.one;
type oneType = typeof oneValue;
assertType<IsExact<FlagType<oneType>, string | undefined>>(true);

// as expected, order of union types doesn't matter
assertType<IsExact<FlagType<oneType>, undefined | string>>(true);
// and it should interpret optional props the same way as T | undefined
type optionalT1 = {
  one?: string;
  two: string | undefined;
};
type optionalT2 = {
  one?: string;
  two?: string;
};
type optionalT3 = {
  one?: string;
};
assertType<IsExact<FlagType<oneType>, optionalT1["one"]>>(true);
assertType<IsExact<FlagType<oneType>, optionalT1["two"]>>(true);

// BUT there's a possible typetest error here:
// I'd expect the two types, then, to be Exactly the same
assertType<IsExact<optionalT1, optionalT2>>(false);
// at least it seems to be commutative
assertType<IsExact<optionalT2, optionalT1>>(false);
// The slightly more tolerant **Has** works
assertType<Has<optionalT1, optionalT2>>(true);
// BUT it tolerates missing props in the second
assertType<Has<optionalT1, optionalT3>>(true);
// So it's not commutative
assertType<Has<optionalT3, optionalT1>>(false); // !!
// and it sees optional as a superset of T | undefined
assertType<Has<optionalT2, optionalT1>>(false); // !!
