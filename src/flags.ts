import type {
  Flag,
  FlagType,
  OptionalFlag,
  ParseResult,
  RequiredFlag,
} from "./types.ts";

// deno-lint-ignore no-explicit-any
export const FailedParse: ParseResult<any> = Object.freeze({ n: 0 });

/**
 * checkFlagDefault audits the flag default value.
 *
 * If the parser has a default, it ALWAYS takes precedence over a flag default
 * because the parser is saying, "my logic depends on a particular thing
 * happening if this flag is absent"
 *
 * LATER: move this to the audit test helper
 * @param flagName string name of flag for error messsage
 * @param parser the FlagParser for the flag (which may have a default.)
 * @param flagDefault any default for this particular flag the developer may have provided
 * @returns
 */
export function checkFlagDefault<V>(
  flagName: string,
  parser: FlagType<V>,
  flagDefault?: V,
): V | undefined {
  const haveParserDefault = parser.default !== undefined;
  const haveFlagDefault = flagDefault !== undefined;
  if (haveParserDefault && haveFlagDefault) {
    throw new Error(
      `flag ${flagName} should not have default ${flagDefault} because it's parser has a mandatory default of ${parser.default}`,
    );
  } else if (haveParserDefault) return parser.default;
  else return flagDefault;
}

/**
 * Create a required flag
 *
 * @param name - long form "slug of the flag", --<name> signals the flag
 * @param description - long description of the flag
 * @param parser - parser to extract the flag's value from arguments
 * @param defaultValue - default value of the flag (otherwise "undefined")
 * @returns an OptionalFlag for a CLI spec
 */
export function required<V>(
  name: string,
  description: string,
  parser: FlagType<V>,
  defaultValue?: V,
): RequiredFlag<V> {
  return {
    name,
    description,
    parser,
    required: true,
    default: checkFlagDefault(name, parser, defaultValue),
  };
}

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
  parser: FlagType<V>,
  defaultValue?: V,
): OptionalFlag<V> {
  return {
    ...required(name, description, parser, defaultValue),
    required: false,
  };
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

/**
 * A normal boolean flag, false by default, true if it's present: e.g. --wrap.
 *
 * If you need fancier, default-true (negatable) flags (e.g. --no-wrap). See
 * falseFlag() below.
 */
export const booleanFlag: FlagType<boolean> = {
  parse(_i: number, _: string[]) {
    // If we get here, the flag is present and already stripped off, so return true
    return { n: 0, value: true };
  },
  default: false, // if it's not there, the flag is false
};

/**
 * Parse a string flag
 */
export const stringFlag: FlagType<string> = {
  parse(i: number, args: string[]) {
    const n = 1;
    const value = args[i];
    if (value) return { n, value };
    return FailedParse;
  },
};

/**
 * Parse a decimal floating point number into a JavaScript number
 */
export const numberFlag: FlagType<number> = {
  parse(i: number, args: string[]) {
    const n = 1;
    const value = parseFloat(args[i]);
    if (isNaN(value)) return FailedParse;
    return { n, value };
  },
};
