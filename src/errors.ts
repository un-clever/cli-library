enum _draftExitCodes {
  NO_ERROR,
  UNRECOGNIZED_SUBCOMMAND = 1000,
  UNRECOGNIZED_FLAG,
  INVALID_FLAG_ARGS,
  UNKNOWN_ERROR = 1500,
}

/**
 * ParsingError gives us a way to throw errors
 * that might happen during parsing with extra metadata to
 */
export class ParsingError extends Error {
  constructor(message: string, private advice = "", private paramName = "") {
    super(message);
  }

  help(): string {
    const messages = [`Parsing error: ${this.message}`];

    // enrich with any metadata that's present
    if (this.paramName) messages.push(`Flag: ${this.paramName}`);
    if (this.advice) messages.push(`Possible solution:\n\n${this.advice}`);

    return messages.join("\n") + "\n";
  }
}

export function GetHelp(err: unknown): string {
  if (err instanceof ParsingError) return err.help();
  if (err instanceof Error) return err.message + "\n";
  return `unrecognized error type: ${typeof err}`;
}
