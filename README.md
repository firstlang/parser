# First Parser

This repository contains the open-source recursive descent parser for the
First programming language.

The parser is intentionally small at this stage. It will eventually be generated
or derived from the language's internal abstract regular expression parser,
which acts as the source of truth for tokens, grammar structure, and parsing
priorities. That internal parser is closed source; this crate is the public Rust
parser intended for tooling, integration, and inspection.

## Status

This project is a scaffold. The public API and parser implementation are not
stable yet.

## Goals

- Provide a readable Rust implementation of the First parser.
- Keep the open-source parser aligned with the internal grammar model.
- Support tooling that needs syntax trees without depending on closed-source
  compiler internals.

## Documentation

Language documentation lives in the main documentation repository:

- [First language documentation](https://github.com/firstlang/documentation)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
