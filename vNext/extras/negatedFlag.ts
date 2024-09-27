import type { FlagtypeDef } from "../types.ts";

/**
 * A negatable boolean flag: e.g. --no-wrap
 *
 * Negatable flags can confuse users and developers, beware. True by default,
 * false if they're present.
 *
 * IMO, If you must have a default-true flag with a --no-destroy, beset to
 * rephrase it if you can. But, here's a helpful type if you want it.
 */

export const negatedFlag: FlagtypeDef<boolean> = {
  parse(_i: number, _: string[]) {
    return { n: 0, value: false }; // negated flags are true by default, false if present
  },
  default: true,
};
