# Un-Clever Command Line App Library

Status: informative, tiny, but unstable

I can be really clever. Sometimes that's a bonus; sometimes it's a footgun. I'm not advocating stupid, mind you. I'm not even saying things always have to be simple because simple can hide a lot of complexity. But with most of the CLI tools and scripts I write, the constant challenge is: "Don't get too clever. This isn't the main task; it's the task you're doing so you can accomplish the main task."

Command line tools are like pajamas. I find myself using them often, but not always the same ones. For the ones I create, they mostly have to be functional, reliable, and easy to maintain more than they have to be beautiful.

I appreciate a beautiful, elegant CLI app. Colors, well-formatted help, progress bars. If you make ones like that, wonderful! Don't use this library! Check out the alternatives I list at the bottom of this README.

But the CLI scripts I write just need to get a job done over time. I want them to help me do that now...and six months from now when I have to use them again. I want to be able to extend or add commands without having to spend a lot of time re-learning a toolkit.

This library has several goals:

- Orthagonal: single-command scripts can be easily combined into one script with subcommands.
- Slim on code: so I can understand it six months from now.
- Slim on deps: to decrease security and size risks. I only want to use built-in's, a simple arg parser, and a validator library.
- Leverage TypeScript: because I don't want to have to re-learn a DSL to maintain s script.
- Leverage A Popular Validation Library: because I do want to ensure CLI args are valid, but I don't want to re-learn an ad-hoc command schema each time I need to write a script.

What do I mean by that last concern? I've built CLI's with a lot of libraries, but they all invent their own way to specify valid command-line arguments, and most of them eventually approach the complexity of a schema validation library (Like Zod, Joi, JSONSchema libraries, etc.) I already use those tools and I don't want to learn new ways to state schema.

So here's the basic concept. An un-clever CLI command has

- *Parser*: a function that takes a `string[]`, parses that string array as command line args into a simple structure *and validates that structure*.
- *Handler*: an async function that accepts a such a structure and does the job and returns an integer exit code.
- *Help*: a string to print out describing the command and it's arguments
- *Version*: a semver of the CLI because versioning is *very good*.

Such commands can easily be combined into an un-clever Multi-CLI that has can list or execute the subcommands.

No magic. That's just leveraging basic TypeScript.

I don't use the library at that level, though. For a little bit more ease (and hidden complexity), there's a function that will take Typebox validator and derived the Help and Parser for me. I hope to add Zod, the other validator I use often.

The approach, I think, is solid: use a simple args parser (we use @std's cross-platform one based on Minimist) to parse the args *tolerantly*. Use an  existing validator library to prevent invalid args. Then pass those args as a single struct to a vanilla function that get's the job done.

## Future Plans

- Optionally read args from environment variables
- Optionally read args from .env or config files
- Optionally type positional arguments
- Confirm that there aren't duplicate commands or arg aliases
- Add single-dash chains (e.g. the `-rf` in `rm -rf`).

## Alternatives

In 2024 I've looked at:

- Commander: battle-tested
- Clipanion: powers yarn, nice, seems to work with Deno. It uses that `class` keyword some misguided coders think is evil (while they proceed to write bad OOP without using the `class` keyword).
- Clerc: nice functional approach, seems to work with Deno. At the time I looked at it, the docs were slim but growing.
- Cliffy: nice Deno-only framework
- OCLI: from SalesForce, looks complicated, reliable, and well-tooled
- Lesy

They all have their own tradeoffs and do a lot more than this package does. I would use them for my occasional CLI's except that:

- Some of them have too many dependencies.
- Few of them let me grow from single-commands to multiple commands easily.
- They all want me to learn their own take on schema validation, and I just want to whatever popular validation framework my larger project is using.
- My CLI's don't need a built-in eventing library. If they do, I'll add that to the handler functions.
