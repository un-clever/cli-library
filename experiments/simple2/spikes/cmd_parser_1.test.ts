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
  // no dashdash
  {desc: "no args", input: [], args: [], dashdash: []},
  {desc: "one arg", input: ["a"], args: ["a"], dashdash: []},
  {desc: "two args", input: ["a", "b"], args: ["a", "b"], dashdash: []},
  {desc: "three args", input: ["a", "b", "c"], args: ["a", "b", "c"], dashdash: []},
  {desc: "four args", input: ["a", "b", "c", "d"], args: ["a", "b", "c", "d"], dashdash: []},
  // with a dashdash
  {desc: "initial dashdash", input: ["--","a", "b",  "c", "d"], args: [] , dashdash: ["a", "b","c", "d"]},
  {desc: "middle dashdash", input: ["a", "b", "--", "c", "d"], args: ["a", "b"] , dashdash: ["c", "d"]},
  {desc: "terminal dashdash", input: ["a", "b", "c", "d", "--"], args: ["a", "b", "c", "d"] , dashdash: []},
];

function parse(flagset: any, rawargs: string[]): CliArgs<{ one?: string }> {
  // initialie
  let tail = rawargs.slice(0);
  const flags = {};
  const args: string[] = [];
  let dashdash: string[] = [];

  // main parse loop
  while (tail.length > 0) {
    // console.debug(tail, tail.length, args, args.length);
    const arg1 = tail.shift() as string;
    // console.debug(tail, arg1, args);
    if (arg1 === "--") {
      dashdash = tail;
      tail = [];
    } else if (arg1.startsWith("-")) args.push("flag");
    else args.push(arg1);
    // console.debug(tail, tail.length, args, args.length);
  }

  // clean and return
  return { flags, args, dashdash };
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
