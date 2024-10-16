import type { OptionalFlag, RequiredFlag } from "./flags.ts";

export type RawArgs = string[];
export type ParsedArgs = string[];

/**
 * Flagset is specification to document and parse a whole set
 * of named flags
 *
 * IMPLEMENTATION:
 * "{} extends Pick<VV, K>" is an okay test for an optional props (thanks to
 * https://blog.beraliv.dev/2021-12-07-get-optional). Without the special
 * comment below, lint will remind us of the non-intuitive fact `{}` doesn't
 * mean an empty object, but means any types other than `null` and `undefined`.
 */
export type Flagset<VV> = {
  // deno-lint-ignore ban-types
  [K in keyof VV]-?: {} extends Pick<VV, K> ? OptionalFlag<Required<VV>[K]>
    : RequiredFlag<VV[K]>;
};

/**
 * FlagsetReturn extracts the interface of the complete parsed flags produced by
 * a flagset, treating OptionalFlag's as optional props.
 *
 * IMPLEMENTATION: This type could be done more easily like this...
 *
 * `type EasyFlagsetReturn<FF> = { [K in keyof FF]: FlagReturn<FF[K]> };`
 *
 * ...which would probably be faster as well as simpler, but doesn't exactly
 * match optional types because a prop that can be absent isn't the same as a
 * prop that must be T | Undefined.
 *
 * This is a common typing problem and may be solved someday with conditional
 * typing of the optional property flag. As of Sep 2024, the only solution I've
 * found is this union type.
 */
export type FlagsetReturn<FF> =
  & FlagsetOptionalProps<FF>
  & FlagsetRequiredProps<FF>;

// a couple helper types for FlagsetReturn
type FlagsetOptionalProps<FF> = {
  // uses "as" to remap/exclude keys that don't match a particular pattern
  // so we can add the "?:" optional token to the definition. There might
  // (someday) be a better way to do this conditionally and avoid the later
  // union type, but for now, it passes the tests.
  [K in keyof FF as FF[K] extends OptionalFlag<unknown> ? K : never]?:
    FF[K] extends OptionalFlag<infer V> ? V : never;
};
type FlagsetRequiredProps<FF> = {
  // uses "as" to remap/exclude keys that don't match a particular pattern
  [K in keyof FF as FF[K] extends RequiredFlag<unknown> ? K : never]:
    FF[K] extends RequiredFlag<infer V> ? V : never;
};

/**
 * ParsedArgs represents the results of successfully parsing a full set of
 * command-line arguments.
 */
export interface ParsedFlags<VV> {
  args: ParsedArgs; // positional args
  flags: VV; // if exit code exists, this may be partial or invalid
  exitCode?: number; // if exists, means exit with code (0=clean), flags and args undefined (likely invalid)
}
