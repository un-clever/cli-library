/**
 * ParseFn: a function that can parse a particular flag type.
 *
 * # KEY CONCEPT: (i: number, args: string[]) => {value:T, n: number}
 *
 * Flag types are extensible. At their core, each type of command-line flags are
 * implemented by functions that:
 *
 * 1. EXPECTS a position (integer > 0) and a list of strings (`i` and `args`).
 * 2. ATTEMPTS to parse a value starting at `args[i]`.
 * 3. If SUCCESSFUL, returns the value and how many strings it consumed `{n, value}`.
 * 4. If UNSUCCESSFUL, returns `{n: 0}` (leaving `value` undefined).
 * 5. NEVER THROWS and exception.
 * 6. NEVER looks backward (at `arg[<i]`) because it might be receiving only a
 *    slice of the command line args
 *
 * NOTE: these functions just parse values; they assume that any flag token, like `--some-flag`,
 * has already been parsed.
 */
export type ParseFn<V> = (
  i: number,
  args: string[],
) => ParseResult<V>;

/**
 * ParseResult: every type of flag has a function that can attempt to
 * parse a value of its type off the front of a list of strings.
 */
export type ParseResult<V> = {
  n: number; // the number of args consumed;
  value?: V; // the resultant value if success, otherwise undefined
};

/**
 * FlagtypeDef(inition) is a ParseFunction (see above) and other metadata necessary to
 * parse a type of flag.
 *
 * .default = the default value for all flags of that type. This is NOT a
 * default value for a particular flag, but for a whole class of flags, like
 * boolean flags (which are presumed false if they don't appear).
 */

/** */
export interface FlagtypeDef<V> {
  parse: ParseFn<V>;
  default?: V;
  // preexecute?: (flagname: string, value: V) => Promise<void>;
  validate?: (value: unknown) => boolean;
}

/**
 * BaseFlag: is the core data necessary to define a particular flag
 */
export interface BaseFlag<V> {
  // the long flag slug, e.g. "keep" for a flag named --keep
  name: string;
  // brief help for the flag
  description: string;
  // parser function
  parser: FlagtypeDef<V>;
  // possible default value
  default?: V;
  // alternative slugs that should be prefixed with --
  aliases?: string[]; // RESERVED: on the roadmap
  // single character shortcuts to be prefixed with -
  shortcuts?: string; // RESERVED: on the roadmap
}

/**
 * RequiredFlag asserts that the flag MUST BE PRESENT in the command-line args.
 * It will always infer it's parsed type as V and require the flag to appear
 * in the CLI args unless a default is provided.
 *
 * NOTE: RequiredFlag and OptionalFlag (below) are discriminated unions of BaseFlag
 * that exist to help strongly type parsings of command lines. They correspond
 * with whether or not the flag is an optional property of the parse result.
 *
 * Therefore, required flags MAY have a default. The semantic of required flags
 * is only that a successfully parsed CLI with that flag will always have a
 * value for that flag, i.e. it's a *required* property of the flagset parse.
 */
export type RequiredFlag<V> = BaseFlag<V> & { required: true };

/**
 * OptionalFlag assets that the flag MAY BE ABSENT from the command-line args.
 * It will infer it's parsed type as V but allow the flag to NOT appear in the
 * CLI args.
 *
 * NOTE that optional flags MAY have a default. The semantic of optional
 * flags is that a successfully parsed CLI with that flag could have the value
 * of undefined, i.e. it's an *optional* property of the flagset parse, so code
 * will have to test for a real value before using the flag. You can do away
 * with such tests by using a RequiredFlag with a default. Defaults are
 * permitted on OptionalFlags too because of the reality that developers
 * sometimes add convenience defaults to CLI's and may want to have the compiler
 * check for nullish tests in case they later remove those defaults.
 */
export type OptionalFlag<F> = BaseFlag<F> & { required: false };

/**
 * Flag is the discriminated union describing any named CLI flag.
 */
export type Flag<V> = RequiredFlag<V> | OptionalFlag<V>;

/**
 * FlagValue extracts the type a Flag's parser is expected to return.
 *
 * If this code seems unfamiliar, see Typescript docs on conditional types.
 * It basically means:
 *
 * 1. To get TypeFromFlag from any type:
 * 2. If that type extends Flag, grab (infer) the type of flag it is.
 * 3. And if it doesn't extend Flag it's an error (should never happen)
 */
export type FlagValue<F> = F extends Flag<infer V> ? V : never;

/**
 * FlagReturn is like FlagValue but takes into account that an optional flag
 * might not appear in the final flag results.
 */
export type FlagReturn<F> = F extends RequiredFlag<infer V> ? V
  : F extends OptionalFlag<infer V> ? V | undefined
  : never;

// deno-lint-ignore no-explicit-any
export const FailedParse: ParseResult<any> = Object.freeze({ n: 0 });

/**
 * checkFlagDefault audits the flag default value.
 *
 * If the parser has a default, it ALWAYS takes precedence over a flag default
 * because the parser is saying, "my logic depends on a particular thing
 * happening if this flag is absent"
 *
 * @param flagName string name of flag for error messsage
 * @param parser the FlagParser for the flag (which may have a default.)
 * @param flagDefault any default for this particular flag the developer may have provided
 * @returns
 */
export function checkFlagDefault<V>(
  flagName: string,
  parser: FlagtypeDef<V>,
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
  parser: FlagtypeDef<V>,
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
  parser: FlagtypeDef<V>,
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
export const booleanFlag: FlagtypeDef<boolean> = {
  parse(_i: number, _: string[]) {
    // If we get here, the flag is present and already stripped off, so return true
    return { n: 0, value: true };
  },
  default: false, // if it's not there, the flag is false
};

/**
 * Parse a string flag
 */
export const stringFlag: FlagtypeDef<string> = {
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
export const numberFlag: FlagtypeDef<number> = {
  parse(i: number, args: string[]) {
    const n = 1;
    const value = parseFloat(args[i]);
    if (isNaN(value)) return FailedParse;
    return { n, value };
  },
};
