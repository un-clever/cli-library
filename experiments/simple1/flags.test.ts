import { assertType, describe } from "testlib";
import type { IsExact } from "testlib";
import { booleanFlag, floatFlag, intFlag, stringFlag } from "./flagParsers.ts";
import type {
  Flag,
  FlagParser,
  FlagSpec,
  FlagsType,
  TypeFromFlag,
} from "./flags.ts";

export function makeFlag<T>(name: string, parser: FlagParser<T>): Flag<T> {
  return {
    slugs: [name],
    description: `your argument named ${name}`,
    shortcuts: [],
    required: false,
    default: undefined,
    parser,
  };
}

/**
 * A simple FlagSpec that could drive a parser
 */
export const simpleFlagSpec = {
  one: makeFlag<string>("one", stringFlag),
  dos: makeFlag<string>("dos", stringFlag),
  three: makeFlag<boolean>("three", booleanFlag),
  four: makeFlag<number>("four", floatFlag),
  cinco: makeFlag<number>("cinco", intFlag),
};

// the type of that FlagSpec
export type SimpleFlagSpec = typeof simpleFlagSpec;

// the type of the flags we expect that FlagSpec to parse
export type SimpleFlags = {
  one: string;
  dos: string;
  three: boolean;
  four: number;
  cinco: number;
};

// We can extract types from a single flag
type StringFlag = SimpleFlagSpec["one"];
assertType<IsExact<string, string>>(true); // Demonstrating a simple type test. They're weird looking at first.
assertType<IsExact<TypeFromFlag<StringFlag>, string>>(true);

// We can strongly type our FlagSpec if we want;
assertType<IsExact<FlagSpec<SimpleFlags>, SimpleFlagSpec>>(true);

// Conversely, we can derive the parsed flags' type from a FlagSpec;
assertType<IsExact<FlagsType<SimpleFlagSpec>, SimpleFlags>>(true);

describe.skip("all flags testing is type driven for now");
