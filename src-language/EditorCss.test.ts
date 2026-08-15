import * as Assert from "node:assert/strict";
import * as Test from "node:test";
import * as X from "../src-language/XX.ts";
import * as Css from "./X.ts";

Test.describe("EditorCss", () =>
{
	Test.test("prints semantic and compound selectors", () =>
	{
		const css = new Css.EditorCss();
		css.add(X.TypedParameterMask, { display: "inline-flex" });
		css.add(X.EntityToken, { color: "var(--entity)" });
		css.add(X.tokenGroups.words, { fontWeight: 600 });
		css.add(X.tokens.fn, { opacity: 0.8 });
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

.fn {
	opacity: 0.8;
}

.typed-stable-function::before {
	content: "";
}

.typed-stable-function > .typed-parameter {
	align-self: start;
}
`);
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
