import {
  assertEquals,
  assertThrows,
  assertType,
  describe,
  type IsExact,
  it,
} from "testlib";
import type { Flagset, FlagtypeDef, ParseResult } from "../types.ts";
import { makeEnumFlag, type StringArrayElements } from "./enumFlag.ts";
import { optional, required } from "../flags.ts";
import { getFlagsetParser } from "../flagset.ts";
import {
  type FlagsetExample,
  testmanyFlagsetExamples,
} from "../tests/testUtils.ts";
import { fuzzedExample } from "../tests/testData.ts";

type flagTestCase<T> = [
  FlagtypeDef<T>, // flagdef to be tested
  string[], // input args
  T | undefined, // expected parse result
  number, // number of args consumed
];
const legalValues = ["one", "two", "three", "four"] as const;
type TlegalValues = "one" | "two" | "three" | "four";

assertType<
  IsExact<StringArrayElements<typeof legalValues>, TlegalValues>
>(true);

const flag1to4: FlagtypeDef<TlegalValues> = makeEnumFlag(legalValues);

/**
 * Examples for enumFlag.ts
 */
describe("enumFlag parsing and use", () => {
  // let's make an array of acceptable values
  const acceptable = ["eager", "lazy"] as const;
  // for convenience, we'll extract a type from it
  type Mode = StringArrayElements<typeof acceptable>;
  // and make a flag that parses that type
  const elFlag = makeEnumFlag(acceptable);

  it("at a low level, parses values off the list of args", () => {
    // cli-library parsers expect a string array of raw arguments...
    const args = ["eager", "lazy", "slovenly"];
    // the index of the element at which to begin parsing...
    const i = 0;
    // and produce a parsing result:
    const result: ParseResult<"eager" | "lazy"> = {
      n: 1, // the number of args consumed
      value: "eager", // the parsed value, if successful, otherwise absent
    };

    // We can demonstrate this with the above constants
    assertEquals(elFlag.parse(i, args), result);

    // Index is used by CLI parsers to step through the arguments
    assertEquals(elFlag.parse(0, args), { n: 1, value: "eager" });
    assertEquals(elFlag.parse(1, args), { n: 1, value: "lazy" });

    // The third argument, "slovenly," doesn't match the enum type
    // so it returns the standard FailedParse result:
    assertEquals(elFlag.parse(2, args), {
      n: 0, // failed parses consume no args
      //value: ABSENT; failed parses don't have a value prop
    });
  });

  it("at a higher level, enumFlags can be used to parse CLI args", () => {
    // Here's the type our flagset will parse.
    // EnumFlags work, but can give type errors if you don't
    // get explicit
    interface FlagArgs {
      input: Mode;
      output?: Mode;
    }
    // first we make a flagset that parses that types
    const flagset: Flagset<FlagArgs> = {
      input: required("input", "input mode", elFlag, "lazy"),
      output: optional("output", "output mode", elFlag),
    };

    const parser = getFlagsetParser(flagset);

    assertEquals(
      parser([]).flags, // with no argument input, just checking .flags output
      {
        input: "lazy", // the default is used for .input
        // output: ABSENT // and .output, being optional, is absent
      },
    );
    // we can explicitly provide --input
    assertEquals(parser(["--input", "lazy"]).flags, { input: "lazy" });
    assertEquals(parser(["--input", "eager"]).flags, { input: "eager" });

    // if we provide output, it shows up
    assertEquals(parser(["--output", "eager"]).flags, {
      input: "lazy",
      output: "eager",
    });

    // missing or illegal values cause an exception
    assertThrows(() => parser(["--input"]));
    assertThrows(() => parser(["--input", "grumpy"]));
    assertThrows(() => parser(["--output", "random"]));
  });
});

describe("the enumFlag defines flag parses that accept only certain strings", () => {
  const enumFlagExamples: flagTestCase<TlegalValues>[] = [
    [flag1to4, ["one"], "one", 1],
    [flag1to4, ["two"], "two", 1],
    [flag1to4, ["three"], "three", 1],
    [flag1to4, ["four"], "four", 1],
    [flag1to4, ["five"], undefined, 0],
    [flag1to4, [""], undefined, 0],
  ];

  it("the parser handles example arguments correctly", () => {
    for (const tname in enumFlagExamples) {
      const [flagdef, args, value, n] = enumFlagExamples[tname];
      const result = flagdef.parse(0, args);
      if (value !== undefined) {
        assertEquals(result, { n, value });
      } else {
        assertEquals(result, { n });
      }
    }
  });
});

describe.skip("the enumFlag defines flag parses that accept only certain strings", () => {
  type enumReturn = { code: TlegalValues };
  const enumFlags = {
    code: required("code", "some code for a thing", flag1to4, "four"),
  };
  const enumFlagsParser = getFlagsetParser(enumFlags);

  // deno-fmt-ignore  (to keep the table concise)
  const enumFlagsExamples: FlagsetExample<enumReturn>[] = [
    ...fuzzedExample<enumReturn>({ raw: [], parsed: { args: [], flags: { code: "four" }}}),
    ...fuzzedExample<enumReturn>({ raw: ["--code", "one"], parsed: { args: [], flags: { code: "one" }}}),
    ...fuzzedExample<enumReturn>({ raw: ["--code", "two"], parsed: { args: [], flags: { code: "two" }}}),
    ...fuzzedExample<enumReturn>({ raw: ["--code", "three"], parsed: { args: [], flags: { code: "three" }}}),
    ...fuzzedExample<enumReturn>({ raw: ["--code", "four"], parsed: { args: [], flags: { code: "four" }}}),
    ...fuzzedExample<enumReturn>({ raw: ["--code", "five"], parsed: new Error()}),
    ...fuzzedExample<enumReturn>({ raw: ["--code"], parsed: new Error()}),
  ];

  testmanyFlagsetExamples(
    "enumFlag Required with Default",
    enumFlagsParser,
    enumFlagsExamples,
  );
});
