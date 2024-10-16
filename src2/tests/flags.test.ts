// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertThrows, describe, it } from "testlib";
import {
  booleanFlag,
  numberFlag,
  optional,
  required,
  stringFlag,
} from "../flags.ts";
import type { FlagtypeDef } from "../types.ts";

export type flagTestCase<T> = [
  FlagtypeDef<T>, // flagdef to be tested
  T | undefined, // expected parse result
  string[], // input args
  string[], // remaining args after parse
];

// deno-fmt-ignore  (to keep the table concise)
const miniParsersTestCases: Record<string, flagTestCase<any>> = {

  //===== BOOLEAN FLAGS
  "boolean flags don't need extra args": [booleanFlag, true, [], []],
  "boolean flags don't consume args": [booleanFlag, true, ["a", "b"], [ "a", "b", ]],

  //===== SIMPLE STRING FLAGS
  "string flags need one argument": [stringFlag, undefined, [], []],
  "string flags consume one argument": [stringFlag, "tree", [ "tree", "mountain", "apple", ], ["mountain", "apple"]],
  "string flags can consume one final argument": [ stringFlag, "tree", ["tree"], [], ],
  // whether the cli parser supports them depends on the quality of  the shell-runtime interface
  "string flags can consume long, quoted arguments": [  stringFlag, "tree with long long branches", [ "tree with long long branches", "mountain", "apple", ], ["mountain", "apple"], ],

  //===== NUMERIC FLAGS
  "numberFlag needs one argument": [numberFlag, undefined, [], []],
  // stick with fractions that convert well to binary because the comparison is exact in the test
  "numberFlag consumes one argument": [numberFlag, 2.5, ["2.5", "fred", "4"], ["fred", "4"]],
  "numberFlag needs only one argument": [numberFlag, 7.25, ["7.25"], []],
  "numberFlag parses integers": [numberFlag, 1.0, ["1"], []],
  "numberFlag parses negative numbers": [numberFlag, -1.5, ["-1.5"], []],
  "numberFlag won't parse words": [numberFlag, undefined, ["zippy"], ["zippy"]],
  "numberFlag grabs first number off dates": [numberFlag, 2020.0, ["2020-02-02"], []],
  "numberFlag grabs first number off malformed numbers": [numberFlag, 25.0, ["25or6to4"], []],
};

describe("test flag mini parsers", () => {
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
