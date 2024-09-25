// Data useful for testing CLI implementations
import type { ArgsExample } from "./testUtils.ts";
import type { FlagSetParser } from "../types.ts";
import { assertEquals, assertThrows, it } from "testlib";

export function testmanyArgExamples(
  parse: FlagSetParser<unknown>,
  examples: ArgsExample[],
) {
  for (const eg of examples) {
    const testTitle = eg.raw.join(" ");
    if (eg.parsed instanceof Error) {
      it(`rejects ${testTitle}`, () => {
        assertThrows(() => parse(eg.raw));
      });
    } else {
      it(`parses ${testTitle}`, () => {
        const { args, dashdash } = parse(eg.raw);
        assertEquals({ args, dashdash }, eg.parsed);
      });
    }
  }
}

// deno-fmt-ignore  (to keep the table concise)
export const simpleArgsCases: ArgsExample[] = [
  {raw: [], parsed: {args:[], dashdash:[]}},
  {raw: ["a"], parsed: {args:["a"], dashdash:[]}},
  {raw: ["a","b"], parsed: {args:["a","b"], dashdash:[]}},
  {raw: ["a","b","c"], parsed: {args:["a","b","c"], dashdash:[]}},
  {raw: ["a","b","c","d"], parsed: {args:["a","b","c","d"], dashdash:[]}},
  {raw: ["a","b","c","d","e"], parsed: {args:["a","b","c","d","e"], dashdash:[]}},
  {raw: ["a","b","c","d","e","f"], parsed: {args:["a","b","c","d","e","f"], dashdash:[]}},
  {raw: ["a","b","c","d","e","f","g"], parsed: {args:["a","b","c","d","e","f","g"], dashdash:[]}},
  {raw: ["a","b","c","d","e","f","g","h"], parsed: {args:["a","b","c","d","e","f","g","h"], dashdash:[]}},
  {raw: ["a","b","c","d","e","f","g","h","i"], parsed: {args:["a","b","c","d","e","f","g","h","i"], dashdash:[]}},
  {raw: ["a","b","c","d","e","f","g","h","i","j"], parsed: {args:["a","b","c","d","e","f","g","h","i","j"], dashdash:[]}},
];

export const DashedWithoutArgs = new Error("missing args after --");

export function makeDashDashCase(
  insertBefore: number,
  eg: ArgsExample,
): ArgsExample {
  if (insertBefore > eg.raw.length) { // dashdash at end causes error
    const raw = [...eg.raw, "--"];
    return { raw, parsed: DashedWithoutArgs };
  }
  const args = eg.raw.slice(0, insertBefore);
  const dashdash = eg.raw.slice(insertBefore);
  const raw = [...args, "--", ...dashdash];
  return ({ raw, parsed: { args, dashdash } });
}

export function makeDashDashCases(insertBefore: number) {
  return (eg: ArgsExample) => makeDashDashCase(insertBefore, eg);
}

export const dashDashCases: ArgsExample[] = [
  ...simpleArgsCases.map(makeDashDashCases(0)),
  ...simpleArgsCases.map(makeDashDashCases(1)),
  ...simpleArgsCases.map(makeDashDashCases(2)),
  ...simpleArgsCases.map(makeDashDashCases(5)),
  ...simpleArgsCases.map(makeDashDashCases(9)),
  ...simpleArgsCases.map(makeDashDashCases(11)),
];
