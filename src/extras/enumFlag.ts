// enum flags are limited sets of strings

import { FailedParse } from "../flags.ts";
import type { FlagtypeDef } from "../types.ts";

/**
 * Extract a union type of the strings making up a string array constant.
 */
export type StringsToEnums<SS extends string[]> = SS[number];

// export type
/**
 * Create a flag type (parser) from an array of legal string values
 * @param legalValues
 * @returns
 */
export function makeEnumFlag<SS extends string[]>(legalValues: SS) {
  type EE = StringsToEnums<SS>;
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
