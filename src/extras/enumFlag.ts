// enum flags are limited sets of strings
import { FailedParse } from "../flags.ts";
import type { FlagtypeDef, StringArrayElements } from "../types.ts";

/**
 * Create a flag type (parser) from an array of legal string values This flag
 * parses does not really parse to an TypeScript enum, but to a string union
 * type, like "a" | "b" | "c".
 *
 * CAUTION: this flag type offers really tight type inference, but you may have
 * to more explicitly type your flagsets to get it to compile. If you're running
 * into type errors, try putting an explicit type on your
 * Flagset<ParsedFlagsType>, making sure optional flags are declaired as
 * optional properties of ParsedFlagsType. See the examples below.
 *
 * @param legalValues a string array with a const assertions (for inference)
 *    example: ["a", "b", "c"] as const
 * @returns a string flag that accepts only those strings
 *
 * # Example
 *
 * ```ts
 * import { assertEquals, assertThrows, describe, it} from "testlib";
 * import type {Flagset, ParseResult, StringArrayElements} from "../types.ts";
 * import {optional, required} from "../flags.ts";
 * import {getFlagsetParser} from "../flagset.ts";
 * import {makeEnumFlag} from "./enumFlag.ts"
 *
 * describe("enumFlag parsing and use", () => {
 *   // let's make an array of acceptable values
 *   const acceptable = ["eager", "lazy"] as const;
 *   // for convenience, we'll extract a type from it
 *   type Mode = StringArrayElements<typeof acceptable>;
 *   // and make a flag that parses that type
 *   const elFlag = makeEnumFlag(acceptable);
 *
 *   it("at a low level, parses values off the list of args", () => {
 *     // cli-library parsers expect a string array of raw arguments...
 *     const args = ["eager", "lazy", "slovenly"];
 *     // the index of the element at which to begin parsing...
 *     const i = 0;
 *     // and produce a parsing result:
 *     const result: ParseResult<"eager" | "lazy"> = {
 *       n: 1, // the number of args consumed
 *       value: "eager", // the parsed value, if successful, otherwise absent
 *     };
 *
 *     // We can demonstrate this with the above constants
 *     assertEquals(elFlag.parse(i, args), result);
 *
 *     // Index is used by CLI parsers to step through the arguments
 *     assertEquals(elFlag.parse(0, args), { n: 1, value: "eager" });
 *     assertEquals(elFlag.parse(1, args), { n: 1, value: "lazy" });
 *
 *     // The third argument, "slovenly," doesn't match the enum type
 *     // so it returns the standard FailedParse result:
 *     assertEquals(elFlag.parse(2, args), {
 *       n: 0, // failed parses consume no args
 *       //value: ABSENT; failed parses don't have a value prop
 *     });
 *   });
 *
 *   it("at a higher level, enumFlags can be used to parse CLI args", () => {
 *     // Here's the type our flagset will parse.
 *     // EnumFlags work, but can give type errors if you don't
 *     // get explicit
 *     interface FlagArgs {
 *       input: Mode;
 *       output?: Mode;
 *     }
 *     // first we make a flagset that parses that types
 *     const flagset: Flagset<FlagArgs> = {
 *       input: required("input", "input mode", elFlag, "lazy"),
 *       output: optional("output", "output mode", elFlag),
 *     };
 *
 *     const parser = getFlagsetParser(flagset);
 *
 *     assertEquals(
 *       parser([]).flags, // with no argument input, just checking .flags output
 *       {
 *         input: "lazy", // the default is used for .input
 *         // output: ABSENT // and .output, being optional, is absent
 *       },
 *     );
 *     // we can explicitly provide --input
 *     assertEquals(parser(["--input", "lazy"]).flags, { input: "lazy" });
 *     assertEquals(parser(["--input", "eager"]).flags, { input: "eager" });
 *
 *     // if we provide output, it shows up
 *     assertEquals(parser(["--output", "eager"]).flags, {
 *       input: "lazy",
 *       output: "eager",
 *     });
 *
 *     // missing or illegal values cause an exception
 *     assertThrows(() => parser(["--input"]));
 *     assertThrows(() => parser(["--input", "grumpy"]));
 *     assertThrows(() => parser(["--output", "random"]));
 *   });
 * });
 * ```
 */
export function makeEnumFlag<SS extends readonly string[]>(
  legalValues: SS,
): FlagtypeDef<StringArrayElements<SS>> {
  type EE = StringArrayElements<SS>;
  const flagParser: FlagtypeDef<EE> = {
    parse: (i: number, args: string[]) => {
      const n = 1;
      const trialValue = args[i];
      if (legalValues.includes(trialValue)) {
        const value = trialValue as EE;
        return { n, value };
      }
      return FailedParse;
    },
  };
  return flagParser;
}
