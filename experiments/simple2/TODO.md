# TODOs and notes

# Flags with defaults should always be RequiredFlag?

Since flags with defaults will always have a value, they should always appear in the parsed flag value. Thing is, coders change their minds, and required props are more about not having to test for nullish values.

Options:

1. Leave as is: only OptionalFlags can have defaults.
2. Opposite: only RequiredFlags can have defaults.
3. CHOSEN THIS: Lenient: allow both to have defaults, OptionalFlag ONLY means dev will test for nullish before using.
