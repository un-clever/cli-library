// deno-lint-ignore-file no-unused-vars no-explicit-any
/**
 * An experiment in trying to get a simple parser to work
 * starting just with positional args, then trying to add
 * typed flag parsing
 */
import { assertEquals, describe, it } from "testlib";
import {
  booleanFlag,
  dateFlag,
  floatFlag,
  intFlag,
  negatedFlag,
  stringFlag,
} from "../flagParsers.ts";
import type { CliArgs, FlagParser } from "../types.ts";

/**
 * A flagset with just positional args
 */
const flagsetJPs = {};

// deno-fmt-ignore  (to keep the table concise)
const flagsetJPcases = [
  {desc: "no args", input: [], args: [], dashdash: []},
  {desc: "one arg", input: ["a"], args: ["a"], dashdash: []},
  {desc: "two args", input: ["a", "b"], args: ["a", "b"], dashdash: []},
  {desc: "three args", input: ["a", "b", "c"], args: ["a", "b", "c"], dashdash: []},
  {desc: "four args", input: ["a", "b", "c", "d"], args: ["a", "b", "c", "d"], dashdash: []},
];

function parse(flagset: any, rawargs: string[]): CliArgs<{ one?: string }> {
  return {
    flags: {},
    args: rawargs,
    dashdash: [],
  };
}

describe("command line parsings", () => {
  for (const { desc, input, args, dashdash } of flagsetJPcases) {
    it(`handles: ${desc}`, () => {
      const result = parse(flagsetJPs, input);
      assertEquals(result.args, args);
      assertEquals(result.dashdash, dashdash);
    });
  }
});
