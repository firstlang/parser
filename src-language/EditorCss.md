# Editor CSS API

`EditorCss.ts` is the authoring and serialization layer for Typical's generated editor stylesheet. It stores semantic selectors rather than handwritten class names and emits ordinary CSS.

## Basic use

```ts
import * as X from "../src-language/XX.ts";
import * as Css from "./EditorCss.ts";

export const editorCss = new Css.EditorCss();

editorCss.add(X.TypedParameterMask, {
	display: "inline-flex",
	columnGap: 0.3125,
});

editorCss.add(X.EntityToken, {
	color: "var(--entity)",
});

editorCss.add(X.tokenGroups.words, {
	color: "var(--keyword)",
});

editorCss.add(X.tokens.fn, {
	fontWeight: 600,
});
```

Selectors may be Mask constructors, FlexToken constructors, individual FixedTokens, or any category object found inside `X.tokenGroups`.

## Compound selectors

Pass an array when a selector has multiple pieces. Parts are concatenated exactly; strings must include any required whitespace.

```ts
editorCss.add([X.TypedStableFunctionMask, "::before"], {
	content: '\"\"',
});

editorCss.add([X.TypedStableFunctionMask, " > ", X.TypedParameterMask], {
	alignSelf: "start",
});

editorCss.add([X.TypedStableFunctionMask, " ", X.EntityToken], {
	fontWeight: 600,
});
```

Do not write semantic class names as strings. Strings are only for CSS syntax that connects or modifies semantic selectors.

## Values and units

Property names use the JavaScript camel-case spelling from `CSSStyleDeclaration`. Custom properties retain their `--name` spelling.

Strings are emitted unchanged. Arrays emit repeated fallback declarations in their given order.

```ts
editorCss.add(X.EntityToken, {
	display: ["-webkit-box", "inline-flex"],
	color: "var(--entity)",
	"--token-glow": "currentColor",
});
```

Numbers have deliberately sanctioned meanings:

- Length properties emit `rem`.
- Naturally unitless properties remain unitless.
- Zero emits `0` without a unit.
- A numeric value on an unclassified property throws during generation. Use a string when another unit or CSS expression is intended.

```ts
{
	fontSize: 1.25,              // 1.25rem
	columnGap: 0.5,              // 0.5rem
	lineHeight: 1.4,             // 1.4
	width: "min(40rem, 90%)",   // unchanged
}
```

Extend `remProperties` or `unitlessProperties` deliberately when another numeric property is sanctioned.

## Responsive values

Conditional values appear inline with the property they replace. There is no bare `when()` function.

```ts
editorCss.add(X.TypedStableFunctionMask, {
	display: [
		"grid",
		Css.whenContainer(X.FunctionMask, { maxWidth: 45 }, "flex"),
		Css.whenContainer(X.FunctionMask, { maxWidth: 25 }, "block"),
	],
	fontSize: [
		1,
		Css.whenScreen({ maxWidth: 40 }, 0.875),
	],
});
```

Numeric query widths mean `rem`; strings allow explicit units and expressions. `whenContainer()` names the referenced Mask class as an inline-size container and emits the required `container-name` and `container-type` declarations automatically.

A CSS container can affect its descendants, not itself. The Mask passed to `whenContainer()` must therefore identify an ancestor of the styled selector in the emitted HTML.

## Generation and printer integration

Generate the file with:

```ts
Fs.writeFileSync(outputPath, editorCss.toString());
```

The language HTML printer should use the same `EditorCss` instance as the authority for semantic class conversion through `editorCss.className(target)`. The eventual integration should remove `tasks.ts` stylesheet inventory scanning; generated HTML and CSS should derive their names from this shared registry instead.

Generation fails for unknown FixedTokens, objects that are not members of `tokenGroups`, empty selectors, invalid query conditions, non-finite numbers, and numeric properties without a sanctioned unit.

Rule order, fallback order, and conditional order follow registration order, making output deterministic for a deterministic stylesheet module.
