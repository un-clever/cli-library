// deno-lint-ignore-file no-explicit-any
import { it } from "@std/testing/bdd";
import { assertEquals, assertThrows, describe } from "testlib";
import { booleanFlag, negatedFlag, stringFlag } from "./parsers.ts";
import type { FlagParser } from "./flags.ts";

type testCase1<T> = [FlagParser<T>, T | undefined, string[], string[]];

// deno-fmt-ignore  (to keep the table concise)
const testTable1: Record<string, testCase1<any>> = {

  //===== BOOLEAN TYPE FLAGS
  "boolean flags don't need extra args": [booleanFlag, true, [], []],
  "boolean flags don't consume args": [booleanFlag, true, ["a", "b"], [ "a", "b", ]],
  "negatable flags don't need extra args": [negatedFlag, false, [], []],
  "negatable flags don't consume args": [negatedFlag, false, ["a", "b"], [ "a", "b", ]],

  //===== SIMPLE STRING FLAGS
  "string flags need one argument": [stringFlag, undefined, [], []],
  "string flags consume one argument": [stringFlag, "tree", [ "tree", "mountain", "apple", ], ["mountain", "apple"]],
  "string flags can consume one final argument": [ stringFlag, "tree", ["tree"], [], ],
  // whether the cli parser supports them depends on the quality of
  // the shell-runtime interface
  "string flags can consume long, quoted arguments": [  stringFlag, "tree with long long branches", [ "tree with long long branches", "mountain", "apple", ], ["mountain", "apple"], ],
};

describe("test flag mini parsers", () => {
  // test the massive table
  for (const desc in testTable1) {
    const [parser, value, argsin, tail] = testTable1[desc];
    it(desc, () => {
      const result = parser(argsin);
      assertEquals(result.value, value, "parsed values should match");
      assertEquals(result.tail, tail, "parsed tail should match expected");
    });
  }
});
