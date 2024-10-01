// deno-lint-ignore-file no-unused-vars
import { assertEquals, assertType, describe, IsExact, it } from "testlib";
import type { FlagsetParseFn, FlagtypeDef, RequiredFlag } from "../types.ts";
import { makeEnumFlag, StringArrayElements } from "./enumFlag.ts";
import { required } from "../flags.ts";
import { FlagsetExample, testmanyFlagsetExamples } from "../tests/testUtils.ts";
import { fuzzedExample } from "../tests/testData.ts";
import { getFlagsetHelp, getFlagsetParser } from "../flagset.ts";

type flagTestCase<T> = [
  FlagtypeDef<T>, // flagdef to be tested
  string[], // input args
  T | undefined, // expected parse result
  number, // number of args consumed
];

describe("the enumFlag defines flag parses that accept only certain strings", () => {
  const legalValues = ["one", "two", "three", "four"] as const;
  type TlegalValues = "one" | "two" | "three" | "four";

  assertType<
    IsExact<StringArrayElements<typeof legalValues>, TlegalValues>
  >(true);

  const flag1to4: FlagtypeDef<TlegalValues> = makeEnumFlag(legalValues);

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

  type enumReturn = { code: TlegalValues };
  const enumFlags = {
    code: required("code", "some code for a thing", flag1to4, "four"),
  };
  const enumFlagsParser = getFlagsetParser(enumFlags);
  const enumFlagsExamples: FlagsetExample<enumReturn>[] = [
    {
      raw: [],
      parsed: { args: [], flags: { code: "four" }, dashdash: [] },
    },
  ];

  it("defaults work correctly", () => {
    testmanyFlagsetExamples(
      "enumFlag Required with Default",
      enumFlagsParser,
      [{
        raw: [],
        parsed: { args: [], flags: { code: "four" }, dashdash: [] },
      }],
    );
  });
});
