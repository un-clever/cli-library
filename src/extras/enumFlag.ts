// enum flags are limited sets of strings

import { FailedParse } from "../flags.ts";
import type { FlagtypeDef } from "../types.ts";

/**
 * Extract a union type of the strings from a string array constant.
 *
 * Examples:
 *
 * StringArrayElements<typeof ["a","b","c"]> => "a" | "b" | "c"
 *
 * const legals = ["text", "html", "markdown"] as const;
 * StringConstantArrayToEnums<legals> => "text" | "html" | "markdown";
 *
 * Notes:
 *
 * The array must be a readonly array, usually produced by adding
 * "as const" to the end of the statement defining it.
 *
 * Thanks to https://stackoverflow.com/questions/41253310/typescript-retrieve-element-type-information-from-array-type
 * for help with this type definition
 */
export type StringArrayElements<ArrayType extends readonly string[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Create a flag type (parser) from an array of legal string values
 * @param legalValues a string array with a const assertions (for inference)
 *    example: ["a", "b", "c"] as const
 * @returns a string flag that accepts only those strings
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
