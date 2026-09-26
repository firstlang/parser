
# Tokens Project — Overview

## What this is

A combined language + editor system, not just a parser or just a language. The language is designed in tandem with a novel editing paradigm; neither is meant to be understood in isolation from the other.

## Core thesis

- Two editing paradigms exist today: text-based (character-centric, flexible, chaotic) and projectional (node-centric, structured, but rigid/unpleasant to use).
- This project targets a third paradigm: editing at the **token** level — coarser than characters, finer than AST nodes.
- Claim: small UX changes (editing whole tokens instead of characters) unlock large architectural gains — safer real-time refactoring, persistent token identity across edits, targeted recompilation, richer UI affordances bound directly to code primitives.
- Side effect: AI agents could issue precise, high-level edit instructions instead of regenerating full code blocks, cutting output token costs.

## Why a new parser was needed

- Token-based editors need a parse tree that UI elements can *bind to and retain* across edits — not just a tree to re-query after every keystroke.
- Mainstream parsing strategies (LL/LR, tree-sitter, recursive descent) don't preserve that kind of persistent, edit-stable structure.
- This led to a new parsing architecture (general-purpose, not tied to one language) — details deferred to a separate API/usage document.

## Sample language

- A TypeScript-like language used as a testbed, with grammar adjustments intended to make it more amenable to token-based editing.
- Language has notable advancements over TypeScript: a sound type system, a novel threading model, and will compile to native code.
- The language and the parsing engine are currently intertwined; eventual goal is to decouple them into a reusable framework + separate language definition.

## Scope note

This document is conceptual framing only. Architecture internals (tapes, charstrings, masks, regex compilation) and usage/API details live in a separate document.

## Structure

The /context/api folder has generated .d.ts files that you should use to get an idea of API shape rather than looking at the raw source code itself, in the interest of token economy.
Before adding or changing parser tokens, masks, fields, sums, tapes, or mask application behavior, read /src-framework/intents.txt and preserve every applicable architectural claim.

## Parser recovery and mask sums

- Invalid, unwanted, or incomplete source is normal parser input. Never throw exceptions or hang because of source input; retain recoverable tokens and partial tapes. Exceptions are reserved for unknown internal states or broken implementation invariants.
- Declare mask alternatives once with `X.sum(...)` and derive their instance union with `X.Sum<typeof ...>`. Do not repeat the alternatives in a tuple annotation or widen the sum to `typeof X.Mask[]`. Break recursive inference at schema/helper return types instead.

## Explicit execution flow

- Never use imports as function calls: importing a module must not perform application work.
- Do not put executable statements, registration, mutation, I/O, or behavior-triggering construction at module scope.
- Put initialization and configuration in named functions and call them explicitly from the task, entry point, or owning caller so execution flow is visible at the call site.

## Imports and repository structure

- Import project modules through their `X.ts`/`XX.ts` barrel and qualify members through the namespace. Do not cherry-pick named exports from individual files.
- A direct named import is allowed when the file exports only one meaningful symbol and that symbol is a class, when namespace qualification would only add noise.
- Do not create a new top-level folder unless the repository's existing structure cannot reasonably accommodate the code.
- Top-level names beginning with `+` are intentionally ignored by Git and hold local/private workspace code. `+src-tools` is the home for local source tools; preserve that boundary and its barrel-file convention.
