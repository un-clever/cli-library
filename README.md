# Un-Clever Command Line App Library

Status: informative, tiny, but unstable.

This is a utilitarian library for writing tools. It's probably not what you want to write a rich, beautiful, CLI app made for mass consumption, but it's just the ticket for that custom CLI you use every other month and don't want to have to re-remember a how a complicated library works just to change it.

## Quick Start

## Philosophy

It emphasizes:

- Small in terms of: lines of code, cognitive burden, dependencies
- Easy to re-learn when you have to modify a tool a year later
- Leverage TypeScript instead of a custom DSL
- Strongly typed

The CLI scripts I write just need to get a job done over time. I want them to help me do that now...and six months from now when I have to use them again. I want to be able to extend or add commands without having to spend a lot of time re-learning a toolkit.

This library has several goals:

- Orthagonal: single-command scripts can be easily combined into one script with subcommands.
- Slim on code: so I can understand it six months from now.
- Slim on deps: to decrease security and size risks. I only want to use built-in's, a simple arg parser, and a validator library.
- Leverage TypeScript: because I don't want to have to re-learn a DSL to maintain a tool.

So here's the basic concept. An un-clever CLI command has

- *Parser*: a function that takes a `string[]`, parses that string array as command line args into a simple structure *and validates that structure*.
- *Handler*: an async function that accepts a such a structure and does the job and returns an integer exit code.
- *Help*: a string to print out describing the command and it's arguments
- *Version*: a semver of the CLI because versioning is *very good*.

Such commands can easily be combined into an un-clever Multi-CLI that has can list or execute the subcommands.

No magic. That's just leveraging basic TypeScript.

## Future Plans

- Optionally read args from environment variables
- Optionally read args from .env or config files
- Optionally type positional arguments
- Confirm that there aren't duplicate commands or arg aliases
- Add single-dash chains (e.g. the `-rf` in `rm -rf`).

## Alternatives

In 2024 I've looked at:

- Commander: battle-tested
- CAC (Command and Conquer)
- Clipanion: powers yarn, nice, seems to work with Deno. It uses that `class` keyword some misguided coders think is evil (while they proceed to write bad OOP without using the `class` keyword).
- Clerc: nice functional approach, seems to work with Deno. At the time I looked at it, the docs were slim but growing.
- Cliffy: nice, seems to be a Deno-only framework
- OCLI: from SalesForce, looks complicated, reliable, and well-tooled
- Lesy
- Yargs
- Built in libs for Deno, Bun, Node

They all have their own tradeoffs and do a lot more than this package does. I would use them for my occasional CLI's except that:

- Some of them have too many dependencies.
- Few of them let me grow from single-commands to multiple commands easily.
- They all want me to learn their own take on schema validation, and I just want to whatever popular validation framework my larger project is using.
- My CLI's don't need a built-in eventing library. If they do, I'll add that to the handler functions.
