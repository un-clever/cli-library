// deno-lint-ignore-file no-explicit-any
import { assertEquals, describe, it } from "testlib";
import { booleanFlag, numberFlag, stringFlag } from "../flags.ts";
import type { FlagtypeDef } from "../types.ts";

// [parser, parse result, input raw args, resulting arg tail]
type testCase1<T> = [FlagtypeDef<T>, T | undefined, string[], string[]];

// deno-fmt-ignore  (to keep the table concise)
const miniParsersTestCases: Record<string, testCase1<any>> = {
  //===== BOOLEAN FLAGS
  "boolean flags don't need extra args": [booleanFlag, true, [], []],
  "boolean flags don't consume args": [booleanFlag, true, ["a", "b"], [ "a", "b", ]],

  //===== SIMPLE STRING FLAGS
  "string flags need one argument": [stringFlag, undefined, [], []],
  "string flags consume one argument": [stringFlag, "tree", [ "tree", "mountain", "apple", ], ["mountain", "apple"]],
  "string flags can consume one final argument": [ stringFlag, "tree", ["tree"], [], ],
  // whether the cli parser supports long quoted args depends on the quality of the shell-runtime interface
  "string flags can consume long, quoted arguments": [  stringFlag, "tree with long long branches", [ "tree with long long branches", "mountain", "apple", ], ["mountain", "apple"], ],

  //===== NUMERIC FLAGS
  "floatFlag needs one argument": [numberFlag, undefined, [], []],
  // stick with fractions that convert well to binary because the comparison is exact in the test
  "floatFlag consumes one argument": [numberFlag, 2.5, ["2.5", "fred", "4"], ["fred", "4"]],
  "floatFlag needs only one argument": [numberFlag, 7.25, ["7.25"], []],
  "floatFlag parses integers": [numberFlag, 1.0, ["1"], []],
  "floatFlag parses negative numbers": [numberFlag, -1.5, ["-1.5"], []],
  "floatFlag won't parse words": [numberFlag, undefined, ["zippy"], ["zippy"]],
  "floatFlag grabs first number off dates": [numberFlag, 2020.0, ["2020-02-02"], []],
  "floatFlag grabs first number off malformed numbers": [numberFlag, 25.0, ["25or6to4"], []],
};

describe("test flag mini parsers", () => {
  // test the massive table
  for (const desc in miniParsersTestCases) {
    const [parser, value, argsin, tail] = miniParsersTestCases[desc];
    it(desc, () => {
      const result = parser.parse(0, argsin);
      assertEquals(result.value, value, "parsed values should match");
      assertEquals(
        argsin.slice(result.n),
        tail,
        "parsed tail should match expected",
      );
    });
  }
});

// export function makeDashDashCase(
//   insertBefore: number,
//   eg: ArgsExample,
// ): ArgsExample {
//   if (insertBefore >= eg.raw.length) { // dashdash at end causes error
//     const raw = [...eg.raw, "--"];
//     return { raw, parsed: GenericParsingError };
//   }
//   const args = eg.raw.slice(0, insertBefore);
//   const dashdash = eg.raw.slice(insertBefore);
//   const raw = [...args, "--", ...dashdash];
//   return ({ raw, parsed: { args, dashdash } });
// }

// export function makeDashDashCases(insertBefore: number) {
//   return (eg: ArgsExample) => makeDashDashCase(insertBefore, eg);
// }

// export const dashDashCases: ArgsExample[] = [
//   ...simpleArgsCases.map(makeDashDashCases(0)),
//   ...simpleArgsCases.map(makeDashDashCases(1)),
//   ...simpleArgsCases.map(makeDashDashCases(2)),
//   ...simpleArgsCases.map(makeDashDashCases(5)),
//   ...simpleArgsCases.map(makeDashDashCases(9)),
//   ...simpleArgsCases.map(makeDashDashCases(11)),
// ];
