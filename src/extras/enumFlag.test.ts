// deno-lint-ignore-file no-unused-vars
import { assertEquals, assertType, describe, type IsExact, it } from "testlib";
import type { FlagsetParseFn, FlagtypeDef, RequiredFlag } from "../types.ts";
import { makeEnumFlag, type StringArrayElements } from "./enumFlag.ts";
import { required } from "../flags.ts";
import {
  type FlagsetExample,
  testmanyFlagsetExamples,
} from "../tests/testUtils.ts";
import { fuzzedExample } from "../tests/testData.ts";
import { getFlagsetHelp, getFlagsetParser } from "../flagset.ts";

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

describe("the enumFlag defines flag parses that accept only certain strings", () => {
  type enumReturn = { code: TlegalValues };
  const enumFlags = {
    code: required("code", "some code for a thing", flag1to4, "four"),
  };
  const enumFlagsParser = getFlagsetParser(enumFlags);

  // deno-fmt-ignore  (to keep the table concise)
  const enumFlagsExamples: FlagsetExample<enumReturn>[] = [
    ...fuzzedExample<enumReturn>({ raw: [], parsed: { args: [], flags: { code: "four" }, dashdash: [] }}),
    ...fuzzedExample<enumReturn>({ raw: ["--code", "one"], parsed: { args: [], flags: { code: "one" }, dashdash: [] }}),
    ...fuzzedExample<enumReturn>({ raw: ["--code", "two"], parsed: { args: [], flags: { code: "two" }, dashdash: [] }}),
    ...fuzzedExample<enumReturn>({ raw: ["--code", "three"], parsed: { args: [], flags: { code: "three" }, dashdash: [] }}),
    ...fuzzedExample<enumReturn>({ raw: ["--code", "four"], parsed: { args: [], flags: { code: "four" }, dashdash: [] }}),
    ...fuzzedExample<enumReturn>({ raw: ["--code", "five"], parsed: new Error()}),
    ...fuzzedExample<enumReturn>({ raw: ["--code"], parsed: new Error()}),
  ];

  testmanyFlagsetExamples(
    "enumFlag Required with Default",
    enumFlagsParser,
    enumFlagsExamples,
    // [
    //   {
    //     raw: [],
    //     parsed: { args: [], flags: { code: "four" }, dashdash: [] },
    //   },
    // ],
  );
});
