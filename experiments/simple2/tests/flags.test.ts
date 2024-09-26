// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertThrows, describe, it } from "testlib";
import {
  booleanFlag,
  numberFlag,
  optional,
  required,
  stringFlag,
} from "../flags.ts";
import type { FlagParser } from "../types.ts";

type testCase1<T> = [FlagParser<T>, T | undefined, string[], string[]];

// deno-fmt-ignore  (to keep the table concise)
const miniParsersTestCases: Record<string, testCase1<any>> = {

  //===== BOOLEAN FLAGS
  "boolean flags don't need extra args": [booleanFlag, true, [], []],
  "boolean flags don't consume args": [booleanFlag, true, ["a", "b"], [ "a", "b", ]],
  // "negatable flags don't need extra args": [negatedFlag, false, [], []],
  // "negatable flags don't consume args": [negatedFlag, false, ["a", "b"], [ "a", "b", ]],

  //===== SIMPLE STRING FLAGS
  "string flags need one argument": [stringFlag, undefined, [], []],
  "string flags consume one argument": [stringFlag, "tree", [ "tree", "mountain", "apple", ], ["mountain", "apple"]],
  "string flags can consume one final argument": [ stringFlag, "tree", ["tree"], [], ],
  // whether the cli parser supports them depends on the quality of
  // the shell-runtime interface
  "string flags can consume long, quoted arguments": [  stringFlag, "tree with long long branches", [ "tree with long long branches", "mountain", "apple", ], ["mountain", "apple"], ],

  //===== NUMERIC FLAGS
  "floatFlag needs one argument": [numberFlag, undefined, [], []],
  // I'm sticking with fractions that convert well to binary because the comparison is exact in the test
  "floatFlag consumes one argument": [numberFlag, 2.5, ["2.5", "fred", "4"], ["fred", "4"]],
  "floatFlag needs only one argument": [numberFlag, 7.25, ["7.25"], []],
  "floatFlag parses integers": [numberFlag, 1.0, ["1"], []],
  "floatFlag parses negative numbers": [numberFlag, -1.5, ["-1.5"], []],
  "floatFlag won't parse words": [numberFlag, undefined, ["zippy"], ["zippy"]],
  "floatFlag grabs first number off dates": [numberFlag, 2020.0, ["2020-02-02"], []],
  "floatFlag grabs first number off malformed numbers": [numberFlag, 25.0, ["25or6to4"], []],

  // ... intFlag also produces a number, but coerces to an int
  // "intFlag needs one argument": [intFlag, undefined, [], []],
  // "intFlag consumes one argument": [intFlag, 1, ["1", "fred", "4"], ["fred", "4"]],
  // "intFlag needs only one argument": [intFlag, 1, ["1"], []],
  // "intFlag ignores decimal fractions": [intFlag, 1.0, ["1.5"], []],
  // "intFlag parses negative numbers": [intFlag, -1001, ["-1001"], []],
  // "intFlag won't parse words": [intFlag, undefined, ["zippy"], ["zippy"]],
  // "intFlag grabs first integer off dates": [intFlag, 2020, ["2020-02-02"], []],
  // "intFlag grabs first number off malformed numbers": [intFlag, 25.0, ["25or6to4"], []],

  // LATER: move to separate module
  //===== DATE TYPES  (these aren't fancy, no time extra time-parsing lib, just whatever new Date will accept.
  // "dateFlag needs one argument": [dateFlag, undefined, [], []],
  // "dateFlag consumes one argument": [dateFlag, new Date(2020,1,2), ["2020-02-02", "fred", "4"], ["fred", "4"]],
  // "dateFlag needs only one argument": [dateFlag, new Date(1001,1,2), ["1001-02-02"], []],
  // but beware, some runtimes add fuzz to the time
  // "dateFlag turns numbers into ambiguous dates": [dateFlag, new Date("1650"), ["1650"], []],
  // "dateFlag turns floats really ambiguous dates": [dateFlag, new Date("1650.5"), ["1650.5"], []],
  // "dateFlag parses negative numbers": [dateFlag, -1001, ["-1001"], []],
  // "dateFlag won't parse words": [dateFlag, undefined, ["zippy"], ["zippy"]],
  // "dateFlag won't parse empty strings": [dateFlag, undefined, [""], [""]],
  // "dateFlag grabs first integer off dates": [dateFlag, 2020, ["2020-02-02"], []],
  // "dateFlag grabs first number off malformed numbers": [dateFlag, 25.0, ["25or6to4"], []],

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

describe("flag factories", () => {
  it("we can make a flag with no default", () => {
    required("flag1", "string flags don't have defaults", stringFlag);
    optional("flag2", "numeric flags don't have defaults", stringFlag);
    required("flag1", "string flags don't have defaults", numberFlag);
    optional("flag2", "numeric flags don't have defaults", numberFlag);
  });
  it("we can set a flag default if the parser doesn't have a default", () => {
    required(
      "flag1",
      "string flags don't have defaults",
      stringFlag,
      "/a/path",
    );
    optional(
      "flag2",
      "numeric flags don't have defaults",
      stringFlag,
      "a long string",
    );
    required("flag1", "string flags don't have defaults", numberFlag, 5.2);
    optional("flag2", "numeric flags don't have defaults", numberFlag, 6.3);
  });
  it("we can make a flag who's parser has a default", () => {
    required("flag1", "boolean flags have defaults", booleanFlag);
    optional("flag1", "boolean flags have defaults", booleanFlag);
  });
  it("but we CAN'T set a flag default if the parser has a default", () => {
    assertThrows(() =>
      required("flag1", "boolean flags have defaults", booleanFlag, true)
    );
    assertThrows(() =>
      required("flag1", "boolean flags have defaults", booleanFlag, false)
    );
    assertThrows(() =>
      optional("flag1", "boolean flags have defaults", booleanFlag, true)
    );
    assertThrows(() =>
      optional("flag1", "boolean flags have defaults", booleanFlag, false)
    );
  });
});
