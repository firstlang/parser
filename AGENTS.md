
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
