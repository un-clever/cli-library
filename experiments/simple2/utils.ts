import type { Flag, FlagParser, OptionalFlag, RequiredFlag } from "./types.ts";

/**
 * Create an optional flag
 * @param name - long form "slug of the flag", --<name> signals the flag
 * @param description - long description of the flag
 * @param parser - parser to extract the flag's value from arguments
 * @param defaultValue - default value of the flag (otherwise "undefined")
 * @returns an OptionalFlag for a CLI spec
 */
export function optional<V>(
  name: string,
  description: string,
  parser: FlagParser<V>,
  defaultValue?: V,
): OptionalFlag<V> {
  return {
    name,
    description,
    parser,
    default: parser.default || defaultValue,
    required: false,
  };
}

/**
 * Create a required flag
 * @param name - long form "slug of the flag", --<name> signals the flag
 * @param description - long description of the flag
 * @param parser - parser to extract the flag's value from arguments
 * @returns an OptionalFlag for a CLI spec
 */
export function required<V>(
  name: string,
  description: string,
  parser: FlagParser<V>,
): RequiredFlag<V> {
  const msg =
    `Flag "--${name}" may not be required because its parser has a default type`;
  if (parser.default) throw new Error(msg);
  return { name, description, parser, required: true };
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
