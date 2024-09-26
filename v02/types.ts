/**
 * Represents an environment variable as a key-value pair.
 */
export type Env = Record<string, string>;

/**
 * Represents unparsed command-line arguments.
 */
export type ArgList = string[];

export type PositionalArgs = (string | number)[];

// CLI exit code
export type ExitCode = number;

export type ParsedArgs<T> = {
  raw: ArgList;
  parsed: T;
  positional: PositionalArgs;
  afterDashDash: ArgList;
};

// Args parser receives CLI params and Records of env vars or config file vars and returns an object
export type Parser<T> = (raw: ArgList, ...envs: Env[]) => ParsedArgs<T>;

/**
 * Represents a command handler function.
 *
 * @template T - The type of the parsed command arguments.
 * @param args - The parsed command arguments.
 * @param positional - The parsed positional arguments.
 * @param raw - The raw argument list that was parsed.
 * @returns A promise that resolves to the exit code of the command.
 */
export type CommandHandler<T> = (
  args: ParsedArgs<T>,
  raw: ArgList
) => Promise<ExitCode>;

export interface CommandMetadata {
  command: string;
  semver: string;
  description: string;
  optionsDocumentation: string;
}
