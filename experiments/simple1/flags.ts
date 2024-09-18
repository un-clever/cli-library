/**
 * A parsed flag with parsing source included
 */
export interface FlagParseAttempt<T> {
  value?: T;
  tail: string[];
}

/**
 * FlagParsers take a list of strings and attempt to parse a flag off the front of it
 * They can presume that they receive all the args AFTER the flag,
 * that is, the flag is already stripped off
 */
export interface FlagParser<T> {
  (args: string[]): FlagParseAttempt<T>;
  default?: T; // mostly used for boolean flags, that must have a default value
}

/**
 * A flag that knows how to parse itself;
 * Hint: if you're implementing, start with strings;
 */
export interface Flag<T> {
  description: string;
  slugs: string[]; // command names
  shortcuts: string[]; // single letter single dash shortcuts
  required?: boolean; // ignored if a default is provided
  default?: T;
  parser: FlagParser<T>;
}

export const dashdash: Flag<string[]> = {
  description: "ignore params after --",
  slugs: ["--"],
  shortcuts: [],
  required: false,
  default: [],
  parser: (args: string[]) => ({ value: args, tail: [] }),
};
