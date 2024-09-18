// deno-lint-ignore-file no-explicit-any
import { it } from "@std/testing/bdd";
import { assertEquals, assertThrows, describe } from "testlib";
import { booleanFlag, negatedFlag } from "./parsers.ts";
import type { FlagParser } from "./flags.ts";

type testCase1<T> = [FlagParser<T>, T | undefined, string[], string[]];
const testTable1: Record<string, testCase1<any>> = {
  "boolean flags don't need extra args": [booleanFlag, true, [], []],
  "boolean flags don't consume args": [booleanFlag, true, ["a", "b"], [
    "a",
    "b",
  ]],
  "negatable flags don't need extra args": [negatedFlag, false, [], []],
  "negatable flags don't consume args": [negatedFlag, false, ["a", "b"], [
    "a",
    "b",
  ]],
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
