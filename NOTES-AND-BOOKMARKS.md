
30 Sep 2024: ideas from pocketbase tools

4. COULD DO: add strings of array to flag types in unclever STARTED
5. COULD DO: add unclever multicommand
6. COULD DO: add config source intercepters (ordered) to unclever, e.g. envvars, config file, should be async and ordered.

See https://www.gnu.org/software/help2man/ and https://github.com/google/argh/issues/3#issuecomment-581144181

6 Oct 2024 While retyping

- [ ] plan on creating passthroughFlag to handle --
- I'm debating whether the passed in logger should be more like console:

  printer.log("output this stdout\n)
  printer.error("output this to stderr or whatever is passed in as it")

  or just pass in stdout and stderr (or whatever) and have a function that wraps it

  see command.makeAsyncLoggerFancy