Concept: build on Simple1 but don't make such large types and aim for 3 files: types, utils for the types, and a simple implementation.

Big Ideas:
- clean:a core that can make multi-commands with no deps
- light: few lines of code
- simple-ish: grab a powerful idea--param types know how to parse themselves, and leverage it. Typings may be complex, but the implementation should be readable.
- composeable: You can make a simple, single-command cli easily. You can combine several of these, without modification, into a variable-depth multi-commmand cli.

command containers don't have flags, just shove flag inheritane down into the actual excutable command