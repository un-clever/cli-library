import { assertEquals, assertType, describe, it } from "testlib";
import { parseArgsDummy } from "./parseArgs.ts";
import { booleanFlag, floatFlag, intFlag, stringFlag } from "./flagParsers.ts";
import { Flag, FlagParser } from "./flags.ts";

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

const _sampleFlagset = {
  one: makeFlag<string>("one", stringFlag),
  dos: makeFlag<string>("dos", stringFlag),
  three: makeFlag<boolean>("three", booleanFlag),
  four: makeFlag<number>("four", floatFlag),
  cinco: makeFlag<number>("cinco", intFlag),
};

// so the question is, can I type this more strongly
const _typecheck1: Record<string, Flag<unknown>> = _sampleFlagset;

export type HaveTo = Required<Flag<string>>;

type _flagsetPropnames = keyof typeof _sampleFlagset;

type ParserPropTypes<Flagset> = {
  [Prop in keyof Flagset]: boolean;
};

type _flagsetProptypes = ParserPropTypes<typeof _sampleFlagset>;

// assertType()

describe("basic parser", () => {
  it("does", () => {
    assertEquals(1, 1);
    assertEquals(parseArgsDummy({}, []), { thing1: "red", thing2: "also red" });
  });
});
