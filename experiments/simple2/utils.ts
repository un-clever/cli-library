import type { Flag, FlagParser, OptionalFlag, RequiredFlag } from "./types.ts";

/**
 * makeFlag() is a simple factory function to make flag structures. You don't have to
 * use it; flag specifications can be literals too.
 *
 * @param name name of the flag
 * @param parser a simple function that tries to turn the next 0-N arguments into a value
 * @param required if true, the flag must appear in the command line or the command aborts with help
 * @param defaultValue if provided, forces the flag to NOT be required and provides an argument if it's missing
 * @returns a Flag<T> structure that, when parsed, is a value of type T
 */
export function makeFlag<T>(
  name: string,
  parser: FlagParser<T>,
  required = false,
  defaultValue?: T,
): OptionalFlag<T> | RequiredFlag<T> {
  const partial = {
    name,
    description: `your argument named ${name}`,
    parser,
  };
  if (defaultValue !== undefined) {
    return {
      ...partial,
      default: defaultValue,
      required: false,
    } as OptionalFlag<T>;
  }
  if (required) return { ...partial, required } as RequiredFlag<T>;
  return { ...partial, required } as OptionalFlag<T>;
}

/**
 * Type guard for RequiredFlag
 * @param f a flag
 * @returns truthy if it's required
 */
export function isRequiredFlag<T>(f: Flag<T>): f is RequiredFlag<T> {
  return f.required;
}

/**
 * Type guard for OptionalFlag
 * @param f a flag
 * @returns truthy if it's optional
 */
export function isOptionalFlag<T>(f: Flag<T>): f is OptionalFlag<T> {
  return !f.required;
}
