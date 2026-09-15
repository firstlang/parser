import * as Assert from "node:assert/strict";
import * as Test from "node:test";
import * as X from "../src-language/XX.ts";
import * as Css from "./XX.ts";

Test.describe("EditorCss", () =>
{
	Test.test("prints semantic and compound selectors", () =>
	{
		const css = new Css.EditorCss();
		css.add(X.TypedParameterMask, { display: "inline-flex" });
		css.add(X.EntityToken, { color: "var(--entity)" });
		css.add(X.tokenGroups.words, { fontWeight: 600 });
		css.add([X.TypedStableFunctionMask, "::before"], { content: '\"\"' });
		css.add([X.TypedStableFunctionMask, " > ", X.TypedParameterMask], { alignSelf: "start" });

		Assert.equal(css.toString(), `.typed-parameter {
	display: inline-flex;
}

.entity-token {
	color: var(--entity);
}

.words {
	font-weight: 600;
}

.typed-stable-function::before {
	content: "";
}

.typed-stable-function > .typed-parameter {
	align-self: start;
}
`);
	});

	Test.test("prints synthesized root and enclosure selectors", () =>
	{
		const css = new Css.EditorCss();
		css.add(Css.EditorRoot, { display: "block" });
		css.add(X.Enclosure, { alignItems: "stretch" });
		css.add(X.Enclosure.paren, { borderRadius: 0.25 });

		Assert.equal(css.toString(), `.root {
	display: block;
}

.enclosure {
	align-items: stretch;
}

.paren {
	border-radius: 0.25rem;
}
`);
	});

	Test.test("prints typed font-face descriptors before ordinary rules", () =>
	{
		const css = new Css.EditorCss();
		css.addFontFace({
			fontFamily: '"Varta"',
			fontStyle: "normal",
			fontWeight: "300 700",
			fontDisplay: "swap",
			src: 'url("varta.woff2") format("woff2")',
			unicodeRange: "U+0000-00FF",
		});
		css.add(Css.EditorRoot, { fontFamily: '"Varta", sans-serif' });

		Assert.equal(css.toString(), `@font-face {
	font-family: "Varta";
	font-style: normal;
	font-weight: 300 700;
	font-display: swap;
	src: url("varta.woff2") format("woff2");
	unicode-range: U+0000-00FF;
}

.root {
	font-family: "Varta", sans-serif;
}
`);
	});

	Test.test("HTML uses mask inheritance and normalized enclosure classes", () =>
	{
		const language = new X.ProjectLanguage();
		const tape = language.createMaskedTape("square(value is int) is int ( return value * value )");
		const html = new X.HtmlPrinter(tape).toHtml();

		Assert.match(html, /class="root"/);
		Assert.match(html, /class="function stable-function typed-stable-function"/);
		Assert.match(html, /class="parameter typed-parameter"/);
		Assert.match(html, /class="enclosure paren"/);
		Assert.doesNotMatch(html, /class="mask(?:\s|")/);
		Assert.doesNotMatch(html, /Enclosure\.paren/);
	});

	Test.test("stable functions use lowercase names while structural declarations use uppercase names", () =>
	{
		const language = new X.ProjectLanguage();
		const functionTape = language.createMaskedTape("greet() ()");
		const classTape = language.createMaskedTape("Greeting ()");

		Assert.ok(functionTape.at(0) instanceof X.StableFunctionMask);
		Assert.ok(classTape.at(0) instanceof X.ClassMask);
	});

	Test.test("HTML classifies constants and generic type names semantically", () =>
	{
		const language = new X.ProjectLanguage();
		const tape = language.createMaskedTape(
			"collect(value is Result(string, int[])) is Result(string, null) ( return value )");
		const html = new X.HtmlPrinter(tape).toHtml();

		Assert.match(html, /class="named-type-expression"><span class="token entity-token uppercase-entity-token">Result<\/span>/);
		Assert.match(html, /class="token constants null">null<\/span>/);
	});

	Test.test("primitive and constant categories supply emphasis and color", () =>
	{
		const css = Css.createEditorCss().toString();

		Assert.match(css, /\.primitives \{\n\tcolor: var\(--editor-blue\);\n\tfont-weight: 700;\n\}/);
		Assert.match(css, /\.constants \{\n\tcolor: var\(--editor-blue\);\n\tfont-weight: 700;\n\}/);
		Assert.doesNotMatch(css, /\.null \{/);
		Assert.doesNotMatch(css, /\.generic-type-expression \{/);
	});

	Test.test("block loop styling does not apply to the each keyword token", () =>
	{
		const css = Css.createEditorCss().toString();

		Assert.match(css, /\.each:not\(\.token\) \{[^}]*\tdisplay: block;/s);
		Assert.doesNotMatch(css, /(?:^|\n)\.each \{\n\tdisplay: block;/);
	});

	Test.test("each loops receive a fieldset-like frame", () =>
	{
		const css = Css.createEditorCss().toString();

		Assert.match(css, /\.each:not\(\.token\) \{[^}]*border-width: 0 1px 1px 0;[^}]*clip-path: inset\(-100vmax 0\);/s);
		Assert.match(css, /\.each:not\(\.token\) > \.entity-token::after \{[^}]*left: calc\(100% \+ 0\.35rem\);[^}]*width: 100vw;/s);
		Assert.match(css, /\.each:not\(\.token\)::before \{[^}]*border-left: 1px solid var\(--editor-line\);[^}]*top: 1\.5ch;/s);
		Assert.match(css, /\.each > \.paren:last-child \{[^}]*margin-top: -0\.875em;/s);
		Assert.doesNotMatch(css, /\.each:not\(\.token\) \{[^}]*border-radius/s);
		Assert.doesNotMatch(css, /\.each:not\(\.token\) > :not\(\.enclosure\) \{[^}]*background/s);
		Assert.doesNotMatch(css, /\.root \{[^}]*background-color/s);
		Assert.match(css, /\.each:not\(\.token\) \{[^}]*padding: 0 0\.75rem 0\.55rem 0;/s);
	});

	Test.test("prints fallback declarations, custom properties, vendor prefixes, and numeric units", () =>
	{
		const css = new Css.EditorCss();
		css.add(X.EntityToken, {
			display: ["-webkit-box", "inline-flex"],
			columnGap: 0.5,
			margin: 0,
			lineHeight: 1.4,
			webkitTextStrokeWidth: "1px",
			"--token-color": "currentColor",
		});

		Assert.equal(css.toString(), `.entity-token {
	display: -webkit-box;
	display: inline-flex;
	column-gap: 0.5rem;
	margin: 0;
	line-height: 1.4;
	-webkit-text-stroke-width: 1px;
	--token-color: currentColor;
}
`);
	});

	Test.test("moves inline responsive values into container and screen rules", () =>
	{
		const css = new Css.EditorCss();
		css.add(X.TypedParameterMask, {
			display: [
				"grid",
				Css.whenContainer(X.TypedStableFunctionMask, { minWidth: "20em", maxWidth: 45 }, "flex"),
				Css.whenContainer(X.TypedStableFunctionMask, { maxWidth: 25 }, "block"),
				Css.whenScreen({ maxWidth: 40 }, "none"),
			],
		});

		Assert.equal(css.toString(), `.typed-stable-function {
	container-name: typed-stable-function;
	container-type: inline-size;
}

.typed-parameter {
	display: grid;
}

@container typed-stable-function (min-width: 20em) and (max-width: 45rem) {
	.typed-parameter {
		display: flex;
	}
}

@container typed-stable-function (max-width: 25rem) {
	.typed-parameter {
		display: block;
	}
}

@media screen and (max-width: 40rem) {
	.typed-parameter {
		display: none;
	}
}
`);
	});

	Test.test("groups declarations with identical conditions", () =>
	{
		const css = new Css.EditorCss();
		css.add(X.TypedParameterMask, {
			display: Css.whenScreen({ minWidth: 30 }, "flex"),
			color: Css.whenScreen({ minWidth: 30 }, "red"),
		});

		Assert.equal(css.toString(), `@media screen and (min-width: 30rem) {
	.typed-parameter {
		display: flex;
	}

	.typed-parameter {
		color: red;
	}
}
`);
	});

	Test.test("returns an empty string when there are no rules", () =>
	{
		Assert.equal(new Css.EditorCss().toString(), "");
	});

	Test.test("rejects unknown and empty selectors", () =>
	{
		const unknownToken = new X.FixedToken("unknown");
		const unknownGroup = {};

		Assert.throws(() => new Css.EditorCss().className(unknownToken), /not present in tokenGroups/);
		Assert.throws(() => new Css.EditorCss().className(unknownGroup), /not a token group/);
		Assert.throws(() => new Css.EditorCss().className(null as never), /Unsupported semantic selector/);

		const empty = new Css.EditorCss();
		empty.add([], { display: "block" });
		Assert.throws(() => empty.toString(), /selector cannot be empty/);

		const whitespace = new Css.EditorCss();
		whitespace.add(["   "], { display: "block" });
		Assert.throws(() => whitespace.toString(), /resolve to an empty string/);
	});

	Test.test("rejects invalid numeric declarations and query conditions", () =>
	{
		const unsupportedUnit = new Css.EditorCss();
		unsupportedUnit.add(X.EntityToken, { rotate: 2 });
		Assert.throws(() => unsupportedUnit.toString(), /no sanctioned unit for rotate/);

		const infiniteValue = new Css.EditorCss();
		infiniteValue.add(X.EntityToken, { width: Number.POSITIVE_INFINITY });
		Assert.throws(() => infiniteValue.toString(), /finite numeric value/);

		const missingWidth = new Css.EditorCss();
		missingWidth.add(X.EntityToken, { display: Css.whenScreen({}, "none") });
		Assert.throws(() => missingWidth.toString(), /must specify minWidth or maxWidth/);

		const infiniteWidth = new Css.EditorCss();
		infiniteWidth.add(X.EntityToken, {
			display: Css.whenScreen({ maxWidth: Number.POSITIVE_INFINITY }, "none"),
		});
		Assert.throws(() => infiniteWidth.toString(), /Query widths must be finite/);
	});

	Test.test("rejects malformed token-group roots", () =>
	{
		Assert.throws(
			() => new Css.EditorCss(Object.freeze(new X.FixedToken("orphan")) as unknown as object),
			/has no property name/,
		);
	});
});
