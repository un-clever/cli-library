/**
 * A simple implementation of a command line interface definer
 */

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
    if (this.paramName) messages.push(`\nParameter: ${this.paramName}`);
    if (this.advice) messages.push(`Possible solution:\n\n${this.advice}`);

    return messages.join("\n") + "\n";
  }
}

export function GetHelp(err: Error | ParsingError): string {
  if (err instanceof ParsingError) return err.help();
  return err.message + "\n";
}